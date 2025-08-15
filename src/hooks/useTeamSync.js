import { useEffect, useCallback } from 'react';
import { ref, set, onValue, off, update } from "firebase/database";
import { db } from './useFirebase.js';
import { v4 as uuidv4 } from 'uuid';

export const useTeamSync = ({
    teamCode,
    userUID,
    role,
    chosen,
    locked,
    played,
    rerolled,
    swappableAttack,
    swappableDefense,
    setTeammateNames,
    setTeamData,
    setChosenAttackers,
    setChosenDefenders,
    setLockedAttackers,
    setLockedDefenders,
    setRerolledAttackers,
    setRerolledDefenders,
    setPlayedAttackers,
    setPlayedDefenders,
}) => {
    const syncTeamState = useCallback(() => {
        if (!teamCode) return;
        const refPath = `teams/${teamCode}/${userUID}/${role}`;
        set(ref(db, refPath), {
            chosen: chosen.map(op => ({ name: op.name, uid: op.uid })),
            locked,
            played,
            rerolled
        });

        const rootUpdate = {};
        if (role === 'attack') rootUpdate.swappableAttack = swappableAttack || null;
        if (role === 'defense') rootUpdate.swappableDefense = swappableDefense || null;

        if (Object.keys(rootUpdate).length > 0) {
            update(ref(db, `teams/${teamCode}/${userUID}`), rootUpdate);
        }
    }, [teamCode, userUID, role, chosen, locked, played, rerolled, swappableAttack, swappableDefense]);

    useEffect(() => {
        if (!teamCode) return;

        const teamRef = ref(db, `teams/${teamCode}`);
        onValue(teamRef, (snapshot) => {
            const data = snapshot.val();
            if (!data) return;

            const now = Date.now();
            const updatedNames = {};
            const incoming = { attackers: [], defenders: [] };

            for (const [uid, entry] of Object.entries(data)) {
                updatedNames[uid] = entry.name || "";
                if (uid === userUID) continue;

                const lastUpdate = entry.lastUpdated || 0;
                if (now - lastUpdate > 1000 * 60 * 5) continue;

                ['attack', 'defense'].forEach(roleKey => {
                    const roleData = entry[roleKey];
                    if (!roleData?.chosen) return;

                    const roleList = roleKey === 'attack' ? incoming.attackers : incoming.defenders;

                    roleData.chosen.forEach(op => {
                        const isSwappable =
                            (roleKey === 'attack' && entry.swappableAttack === op.uid) ||
                            (roleKey === 'defense' && entry.swappableDefense === op.uid);
                        roleList.push({
                            name: op.name,
                            uid: op.uid,
                            owner: uid,
                            locked: roleData.locked?.includes(op.uid) ?? false,
                            rerolled: roleData.rerolled?.includes(op.uid) ?? false,
                            played: roleData.played?.includes(op.uid) ?? false,
                            swapped: isSwappable,
                        });
                    });
                });
            }

            setTeammateNames(updatedNames);
            setTeamData(incoming);

            const checkSwaps = (sideKey) => {
                const field = sideKey === 'attack' ? 'swappableAttack' : 'swappableDefense';

                const swappables = Object.entries(data)
                    .filter(([, val]) => val?.[field])
                    .map(([uid, val]) => ({
                        uid,
                        opUid: val[field],
                        chosen: val?.[sideKey]?.chosen || [],
                    }));

                if (swappables.length !== 2) return;

                const [a, b] = swappables;
                const aOp = a.chosen.find(op => op.uid === a.opUid);
                const bOp = b.chosen.find(op => op.uid === b.opUid);
                if (!aOp || !bOp) return;

                const updates = {};

                const makeUid = (op) => `${op.name}-${Date.now()}`;
                const makeOp = (op) => ({
                    name: op.name,
                    uid: makeUid(op),
                });

                const newAOp = {
                    name: bOp.name,
                    image: bOp.image || `images/operators/${bOp.name.toLowerCase().replace(/[^a-z0-9]/gi, '')}.png`,
                    uid: `${bOp.name}-${Date.now()}`
                };

                const newBOp = {
                    name: aOp.name,
                    image: aOp.image || `images/operators/${aOp.name.toLowerCase().replace(/[^a-z0-9]/gi, '')}.png`,
                    uid: `${aOp.name}-${Date.now()}`
                };

                const newAChosen = [
                    ...a.chosen.filter(o => o.uid !== a.opUid),
                    makeOp(bOp)
                ];
                const newBChosen = [
                    ...b.chosen.filter(o => o.uid !== b.opUid),
                    makeOp(aOp)
                ];

                updates[`teams/${teamCode}/${a.uid}/${sideKey}/chosen`] = newAChosen;
                updates[`teams/${teamCode}/${b.uid}/${sideKey}/chosen`] = newBChosen;
                updates[`teams/${teamCode}/${a.uid}/${field}`] = null;
                updates[`teams/${teamCode}/${b.uid}/${field}`] = null;

                update(ref(db), updates).catch(err => {
                    console.error(`[Swap] Failed to auto-swap:`, err);
                });

                if (a.uid === userUID) {
                    if (sideKey === 'attack') {
                        setChosenAttackers(prev => [...prev.filter(op => op.uid !== a.opUid), newAOp]);
                        setLockedAttackers(prev => prev.filter(uid => uid !== a.opUid));
                        setRerolledAttackers(prev => prev.filter(uid => uid !== a.opUid));
                        setPlayedAttackers(prev => prev.filter(uid => uid !== a.opUid));
                    } else {
                        setChosenDefenders(prev => [...prev.filter(op => op.uid !== a.opUid), newAOp]);
                        setLockedDefenders(prev => prev.filter(uid => uid !== a.opUid));
                        setRerolledDefenders(prev => prev.filter(uid => uid !== a.opUid));
                        setPlayedDefenders(prev => prev.filter(uid => uid !== a.opUid));
                    }
                }

                if (b.uid === userUID) {
                    if (sideKey === 'attack') {
                        setChosenAttackers(prev => [...prev.filter(op => op.uid !== b.opUid), newBOp]);
                        setLockedAttackers(prev => prev.filter(uid => uid !== b.opUid));
                        setRerolledAttackers(prev => prev.filter(uid => uid !== b.opUid));
                        setPlayedAttackers(prev => prev.filter(uid => uid !== b.opUid));
                    } else {
                        setChosenDefenders(prev => [...prev.filter(op => op.uid !== b.opUid), newBOp]);
                        setLockedDefenders(prev => prev.filter(uid => uid !== b.opUid));
                        setRerolledDefenders(prev => prev.filter(uid => uid !== b.opUid));
                        setPlayedDefenders(prev => prev.filter(uid => uid !== b.opUid));
                    }
                }
            };

            checkSwaps('attack');
            checkSwaps('defense');
        });

        update(ref(db, `teams/${teamCode}/${userUID}`), { lastUpdated: Date.now() })
            .catch((err) => console.error("Firebase update failed:", err));

        const interval = setInterval(() => {
            update(ref(db, `teams/${teamCode}/${userUID}`), { lastUpdated: Date.now() })
                .catch((err) => console.error("Firebase update failed:", err));
        }, 60000);

        return () => {
            off(teamRef);
            clearInterval(interval);
        };
    }, [teamCode, userUID, setTeammateNames, setTeamData]);

    return {
        syncTeamState,
    }
};