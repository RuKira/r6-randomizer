import { useEffect, useCallback } from 'react';
import { ref, set, onValue, off, update } from "firebase/database";
import { db } from './useFirebase.js';

// ADD COMMENT TO EXPLAIN THE FUNCTIONALITY

export const useTeamSync = ({
    teamCode,
    userUID,
    role,
    chosen,
    locked,
    played,
    rerolled,
    setTeammateNames,
    setTeamData
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
    }, [teamCode, userUID, role, chosen, locked, played, rerolled]);

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
                        roleList.push({
                            name: op.name,
                            uid: op.uid,
                            owner: uid,
                            locked: roleData.locked?.includes(op.uid) ?? false,
                            rerolled: roleData.rerolled?.includes(op.uid) ?? false,
                            played: roleData.played?.includes(op.uid) ?? false,
                        });
                    });
                });
            }

            setTeammateNames(updatedNames);
            setTeamData(incoming);
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

    return { syncTeamState };
};
