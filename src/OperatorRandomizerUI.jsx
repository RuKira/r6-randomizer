import { useEffect, useRef, useState, useCallback } from 'react';
import { db } from './firebase';
import { ref, set, onValue, off, update } from "firebase/database";
import { v4 as uuidv4 } from 'uuid'
import './App.css';

function OperatorRandomizerUI() {
    const layoutRef = useRef();
    const STORAGE_KEY = "r6-randomizer-preset";
    const [attackers, setAttackers] = useState([]);
    const [defenders, setDefenders] = useState([]);
    const [chosenAttackers, setChosenAttackers] = useState([]);
    const [chosenDefenders, setChosenDefenders] = useState([]);
    const [feedback, setFeedback] = useState("");
    const [lockedAttackers, setLockedAttackers] = useState([]);
    const [lockedDefenders, setLockedDefenders] = useState([]);
    const [rerolledAttackers, setRerolledAttackers] = useState([]);
    const [rerolledDefenders, setRerolledDefenders] = useState([]);
    const [playedAttackers, setPlayedAttackers] = useState([]);
    const [playedDefenders, setPlayedDefenders] = useState([]);
    const [fadingReroll, setFadingReroll] = useState(null);
    const [allowDupes, setAllowDupes] = useState(true);
    const [weightChanges, setWeightChanges] = useState({});
    const [teamCode, setTeamCode] = useState(localStorage.getItem("team-code") || "");
    const [teamData, setTeamData] = useState({ attackers: [], defenders: [] });
    const [teammateNames, setTeammateNames] = useState({});
    const [myName, setMyName] = useState(localStorage.getItem("team-username") || "");
    const [userUID] = useState(() => {
        const stored = localStorage.getItem("team-user-uid");
        if (stored) return stored;
        const newUID = crypto.randomUUID();
        localStorage.setItem("team-user-uid", newUID);
        return newUID;
    });

    const syncTeamState = useCallback((role) => {
        if (!teamCode) return;

        const refPath = `teams/${teamCode}/${userUID}/${role}`;
        set(ref(db, refPath), {
            chosen: (role === 'attack' ? chosenAttackers : chosenDefenders).map(op => op.name),
            locked: role === 'attack' ? lockedAttackers : lockedDefenders,
            played: role === 'attack' ? playedAttackers : playedDefenders,
            rerolled: role === 'attack' ? rerolledAttackers : rerolledDefenders
        });
    }, [
        teamCode,
        userUID,
        chosenAttackers, chosenDefenders,
        lockedAttackers, lockedDefenders,
        playedAttackers, playedDefenders,
        rerolledAttackers, rerolledDefenders
    ]);

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

                ['attack', 'defense'].forEach(role => {
                    const roleData = entry[role];
                    if (!roleData?.chosen) return;

                    const roleList = role === 'attack' ? incoming.attackers : incoming.defenders;

                    roleData.chosen.forEach(name => {
                        roleList.push({
                            name,
                            owner: uid,
                            locked: roleData.locked?.includes(name) ?? false,
                            rerolled: roleData.rerolled?.includes(name) ?? false,
                            played: roleData.played?.includes(name) ?? false,
                        });
                    });
                });
            }

            setTeammateNames(updatedNames);
            setTeamData(incoming);
        });

        syncTeamState('attack');
        syncTeamState('defense');

        return () => off(teamRef);
    }, [syncTeamState, teamCode, userUID]);

    useEffect(() => {
        if (teamCode) syncTeamState('attack');
    }, [chosenAttackers, lockedAttackers, playedAttackers, rerolledAttackers, syncTeamState, teamCode]);

    useEffect(() => {
        if (teamCode) syncTeamState('defense');
    }, [chosenDefenders, lockedDefenders, playedDefenders, rerolledDefenders, syncTeamState, teamCode]);

    useEffect(() => {
        if (!teamCode) return;

        const path = `teams/${teamCode}/${userUID}`;
        update(ref(db, path), { lastUpdated: Date.now() });
        const interval = setInterval(() => {
            update(ref(db, path), { lastUpdated: Date.now() });
        }, 60000); // refresh every minute

        return () => clearInterval(interval);
    }, [teamCode, userUID]);

    const renderTeammateOperators = (list) => {
        const grouped = {};
        for (const op of list) {
            if (!grouped[op.owner]) grouped[op.owner] = [];
            grouped[op.owner].push(op);
        }

        const teammateUIDs = Object.keys(grouped).slice(0, 4);

        return (
            <div className="teammates-row">
                {teammateUIDs.map((uid, index) => (
                    <div key={uid}>
                        {/* Divider Between Teammates */}
                        {index !== 0 && <div className="teammate-divider" />}

                        {/* Teammate Name Input */}
                        <div className="teammate-name">
                            {uid === userUID ? (
                                <input
                                    type="text"
                                    value={teammateNames[uid] || ""}
                                    onChange={(e) => handleNameChange(uid, e.target.value)}
                                    placeholder="Enter name"
                                />
                            ) : (
                                <div className="teammate-display-name">
                                    {teammateNames[uid] || "Unnamed"}
                                </div>
                            )}
                        </div>

                        {/* Teammate Operator Icons */}
                        <div className="teammate-group">
                            {grouped[uid].map((op, idx) => (
                                <div
                                    key={idx}
                                    className={`teammate-icon-wrapper ${op.locked ? 'locked' : ''} ${op.rerolled ? 'rerolled' : ''} ${op.played ? 'played' : ''}`}
                                    title={op.name}
                                >
                                    <img
                                        src={`images/operators/${op.name.toLowerCase().replace(/[^a-z0-9]/gi, '')}.png`}
                                        alt={op.name}
                                        className="teammate-icon"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    const handleNameChange = (uid, newName) => {
        setTeammateNames(prev => ({ ...prev, [uid]: newName }));

        const userRef = ref(db, `teams/${teamCode}/${uid}`);
        update(userRef, { name: newName });
    };


    useEffect(() => {
        const baseHeight = 1080;

        const scaleLayout = () => {
            const height = window.innerHeight;
            const scale = Math.min(height / baseHeight, 1);
            if (layoutRef.current) {
                layoutRef.current.style.transform = `scale(${scale})`;
            }
        };

        scaleLayout();
        window.addEventListener('resize', scaleLayout);

        const attackerNames = [
            "Striker", "Sledge", "Thatcher", "Ash", "Thermite", "Twitch", "Montagne", "Glaz", "Fuze", "Blitz", "IQ",
            "Buck", "Blackbeard", "Capitao", "Hibana", "Jackal", "Ying", "Zofia", "Dokkaebi",
            "Maverick", "Nomad", "Gridlock", "Nokk", "Amaru", "Kali", "Iana", "Ace", "Zero", "Flores", "Osa",
            "Sens", "Grim", "Brava", "Ram", "Deimos", "Rauora"
        ];
        const defenderNames = [
            "Sentry", "Smoke", "Mute", "Castle", "Pulse", "Doc", "Rook", "Kapkan", "Tachanka", "Jager", "Bandit",
            "Frost", "Valkyrie", "Caveira", "Echo", "Mira", "Lesion", "Ela", "Vigil",
            "Clash", "Kaid", "Mozzie", "Warden", "Wamai", "Goyo", "Oryx", "Melusi", "Aruni",
            "Thunderbird", "Thorn", "Azami", "Solis", "Fenrir", "Tubarao", "Skopos"
        ];

        const buildOps = (names, role) => names.map((name) => ({
            uid: `${role}-${name.replace(/[^a-z0-9]/gi, '').toLowerCase()}`,
            name,
            role,
            weight: 5,
            enabled: true,
            image: `images/operators/${name.toLowerCase().replace(/[^a-z0-9]/gi, '')}.png`
        }));

        const baseAttackers = buildOps(attackerNames, 'attack');
        const baseDefenders = buildOps(defenderNames, 'defense');

        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
        if (saved) {
            setAttackers(loadDisabledOperators(baseAttackers, 'attack', saved));
            setDefenders(loadDisabledOperators(baseDefenders, 'defense', saved));
        } else {
            setAttackers(baseAttackers);
            setDefenders(baseDefenders);
        }

        return () => window.removeEventListener('resize', scaleLayout);
    }, []);

    const toggleLock = (uid, role) => {
        const locked = role === 'attack' ? lockedAttackers : lockedDefenders;
        const setLocked = role === 'attack' ? setLockedAttackers : setLockedDefenders;

        if (locked.includes(uid)) {
            setLocked(locked.filter(id => id !== uid));
        } else {
            setLocked([...locked, uid]);
        }

        syncTeamState(role)
    };

    const toggleOperator = (uid, role) => {
        const list = role === 'attack' ? attackers : defenders;
        const setList = role === 'attack' ? setAttackers : setDefenders;
        const chosenList = role === 'attack' ? chosenAttackers : chosenDefenders;

        const updatedList = list.map(op =>
            op.uid === uid ? { ...op, enabled: !op.enabled } : op
        );
        setList(updatedList);

        const operator = list.find(op => op.uid === uid);
        if (!operator) return;

        const wasChosen = chosenList.find(op => op.name === operator.name);
        const isNowDisabled = updatedList.find(op => op.uid === uid)?.enabled === false;

        if (wasChosen && isNowDisabled) {
            rerollOperator(wasChosen.uid, role);
        }
    };

    const removeChosen = (uid, role) => {
        if (role === 'attack') {
            setPlayedAttackers(prev => [...prev, uid]);

            setTimeout(() => {
                setChosenAttackers(prev => prev.filter(op => op.uid !== uid));
                setPlayedAttackers(prev => prev.filter(id => id !== uid));
            }, 800);
        } else {
            setPlayedDefenders(prev => [...prev, uid]);

            setTimeout(() => {
                setChosenDefenders(prev => prev.filter(op => op.uid !== uid));
                setPlayedDefenders(prev => prev.filter(id => id !== uid));
            }, 800);
        }
        syncTeamState(role)
    };

    const weightedRandom = (list) => {
        const pool = [];

        for (const op of list) {
            if (op.enabled) {
                for (let i = 0; i < op.weight; i++) {
                    pool.push(op);
                }
            }
        }

        if (pool.length === 0) return null;

        for (let i = pool.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [pool[i], pool[j]] = [pool[j], pool[i]];
        }

        return pool[0];
    };

    const rollOperators = (role) => {
        const list = role === 'attack' ? attackers : defenders;
        const setList = role === 'attack' ? setAttackers : setDefenders;
        const setChosen = role === 'attack' ? setChosenAttackers : setChosenDefenders;
        const locked = role === 'attack' ? lockedAttackers : lockedDefenders;
        const chosen = role === 'attack' ? chosenAttackers : chosenDefenders;

        const preset = JSON.parse(localStorage.getItem(STORAGE_KEY));
        const savedDisabled = preset ? preset[role] || [] : [];

        let cleanedList = list.map(op => {
            if (!op.enabled && !savedDisabled.includes(op.name)) {
                return { ...op, enabled: true };
            }
            return op;
        });

        const originalList = [...cleanedList];
        const lockedOps = chosen.filter(op => locked.includes(op.uid));
        const result = [...lockedOps.map((op, idx) => ({ ...op, uid: `${op.name}-${idx}` }))];
        const usedNames = new Set(lockedOps.map(op => op.name));

        while (result.length < 6) {
            const pool = cleanedList.filter(op =>
                op.enabled && (allowDupes || !usedNames.has(op.name))
            );

            const op = weightedRandom(pool);
            if (!op) break;

            result.push({ ...op, uid: `${op.name}-${result.length}` });
            usedNames.add(op.name);

            cleanedList = cleanedList.map(o => {
                if (o.name === op.name) {
                    return { ...o, weight: Math.max(1, o.weight - 5) };
                }
                return o;
            });
        }

        const finalList = cleanedList.map(op => {
            if (!usedNames.has(op.name) && op.enabled) {
                return { ...op, weight: Math.min(15, op.weight + 2) };
            }
            return op;
        });

        const newWeightChanges = {};

        originalList.forEach((oldOp) => {
            const newOp = finalList.find(o => o.name === oldOp.name);
            if (!newOp) return;

            if (newOp.weight > oldOp.weight) {
                newWeightChanges[oldOp.name] = 'up';
            } else if (newOp.weight < oldOp.weight) {
                newWeightChanges[oldOp.name] = 'down';
            } else if (newOp.weight === 15) {
                newWeightChanges[oldOp.name] = 'hold'; // maxed out, no change possible
            }
        });

        setWeightChanges(prev => ({
            ...prev,
            ...newWeightChanges,
        }));
        setList(finalList);
        setChosen(result);

        setTimeout(() => setWeightChanges({}), 1000);

        if (role === 'attack') {
            setLockedAttackers(prev => prev.filter(name => usedNames.has(name)));
            setRerolledAttackers(prev => prev.filter(name => !usedNames.has(name)));
            setPlayedAttackers(prev => prev.filter(name => !usedNames.has(name)));
        } else {
            setLockedDefenders(prev => prev.filter(name => usedNames.has(name)));
            setRerolledDefenders(prev => prev.filter(name => !usedNames.has(name)));
            setPlayedDefenders(prev => prev.filter(name => !usedNames.has(name)));
        }

        syncTeamState(role)
    };

    const handleRollBoth = () => {
        setLockedAttackers([]);
        setLockedDefenders([]);
        setRerolledAttackers([]);
        setRerolledDefenders([]);
        setPlayedAttackers([]);
        setPlayedDefenders([]);

        rollOperators('attack');
        rollOperators('defense');
    };

    const resetAll = () => {
        const preset = JSON.parse(localStorage.getItem(STORAGE_KEY));

        if (preset) {
            setAttackers(prev => loadDisabledOperators(prev, 'attack', preset, true)); // true = ignore weights
            setDefenders(prev => loadDisabledOperators(prev, 'defense', preset, true));
        } else {
            const reset = list => list.map(op => ({ ...op, enabled: true, weight: 5 }));
            setAttackers(prev => reset(prev));
            setDefenders(prev => reset(prev));
        }

        setChosenAttackers([]);
        setChosenDefenders([]);
        setLockedAttackers([]);
        setLockedDefenders([]);
        setRerolledAttackers([]);
        setRerolledDefenders([]);
        setPlayedAttackers([]);
        setPlayedDefenders([]);
    };


    const renderGrid = (list, role) => (
        <div className="grid-operators">
            {list.map(op => (
                <div
                    key={op.uid} // ✅ Use UID instead of name for React key
                    title={op.name}
                    className={`op-icon ${op.enabled ? '' : 'disabled'}
                    ${weightChanges[op.uid] === 'up' ? 'weight-up' : ''}
                    ${weightChanges[op.uid] === 'down' ? 'weight-down' : ''}
                    ${weightChanges[op.uid] === 'hold' ? 'weight-hold' : ''}
                `}
                    onClick={() => toggleOperator(op.uid, role)} // ✅ UID-based toggle
                >
                    {op.enabled && <span className="op-weight">{op.weight}</span>}
                    <img src={op.image} alt={op.name} />
                </div>
            ))}
        </div>
    );

    const rerollOperator = (uid, role) => {
        const setChosen = role === 'attack' ? setChosenAttackers : setChosenDefenders;
        const setRerolled = role === 'attack' ? setRerolledAttackers : setRerolledDefenders;
        const chosenList = role === 'attack' ? chosenAttackers : chosenDefenders;
        const list = role === 'attack' ? attackers : defenders;

        setFadingReroll(uid);

        setTimeout(() => {
            const filtered = chosenList.filter(op => op.uid !== uid);
            const usedNames = new Set(filtered.map(op => op.name));
            const candidates = list.filter(op => op.enabled && !usedNames.has(op.name));

            const replacement = weightedRandom(candidates);
            const newOp = replacement ? { ...replacement, uid } : null;

            const newChosen = newOp ? [...filtered, newOp] : filtered;

            setChosen(newChosen);

            if (replacement) {
                setRerolled(prev => [...new Set([...prev, uid])]);
            }

            update(ref(db, `teams/${teamCode}/${userUID}`), { lastUpdated: Date.now() });

            setFadingReroll(null);

            syncTeamState(role)
        }, 300);
    };

    const renderChosen = (list, role) => {
        const lockedList = role === 'attack' ? lockedAttackers : lockedDefenders;
        const rerolled = role === 'attack' ? rerolledAttackers : rerolledDefenders;
        const played = role === 'attack' ? playedAttackers : playedDefenders;


        return (
            <div className="chosen-operators">
                {list.map((op, idx) => (
                    <div
                        key={op.uid || `${op.name}-${idx}`} // use uid if available
                        className={`chosen-icon
                            ${lockedList.includes(op.uid) ? 'locked' : ''}
                            ${rerolled.includes(op.uid) ? 'rerolled' : ''}
                            ${played.includes(op.uid) ? 'played' : ''}
                            ${fadingReroll === op.uid ? 'fade-out' : ''}
                        `}
                    >
                        <img src={op.image} alt={op.name} title={op.name} />
                        <div className="chosen-buttons">
                            <button onClick={() => rerollOperator(op.uid, role)} title="Reroll">🔁</button>
                            <button onClick={() => toggleLock(op.uid, role)} title={lockedList.includes(op.uid) ? "Unlock" : "Lock"}>
                                {lockedList.includes(op.uid) ? "🔒" : "🔓"}
                            </button>
                            <button onClick={() => removeChosen(op.uid, role)} title="Played (Remove)">✅</button>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    const saveDisabledOperators = (attackers, defenders, includeWeights = false) => {
        const data = {
            attack: attackers.filter(op => !op.enabled).map(op => op.name),
            defense: defenders.filter(op => !op.enabled).map(op => op.name),
        };

        if (includeWeights) {
            data.attackWeights = attackers.map(op => ({ name: op.name, weight: op.weight }));
            data.defenseWeights = defenders.map(op => ({ name: op.name, weight: op.weight }));
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    };


    const loadDisabledOperators = (ops, role, preset, ignoreWeights = false) => {
        const weightsMap = new Map(
            (ignoreWeights ? [] : (preset[`${role}Weights`] || [])).map(w => [w.name, w.weight])
        );

        return ops.map(op => ({
            ...op,
            enabled: !preset[role].includes(op.name),
            weight: weightsMap.has(op.name) ? weightsMap.get(op.name) : 5,
            uid: op.uid ?? `${op.role}-${op.name}`
        }));
    };

    const showFeedback = (message) => {
        setFeedback(message);
        setTimeout(() => setFeedback(""), 2000); // Clears after 2 seconds
    };

    const handleSavePreset = () => {
        saveDisabledOperators(attackers, defenders);
        showFeedback("Preset saved!");
    };

    const handleDefaultPreset = () => {
        const resetAttack = attackers.map(op => ({ ...op, enabled: true }));
        const resetDefense = defenders.map(op => ({ ...op, enabled: true }));

        setAttackers(resetAttack);
        setDefenders(resetDefense);
        saveDisabledOperators(resetAttack, resetDefense); // Save the new default state
        showFeedback("Default preset applied & saved!");

        setLockedAttackers([]);
        setLockedDefenders([]);
        setRerolledAttackers([]);
        setRerolledDefenders([]);
        setPlayedAttackers([]);
        setPlayedDefenders([]);
    };

    const handleSaveWeights = () => {
        saveDisabledOperators(attackers, defenders, true);
        showFeedback("Weights saved to preset!");
    };

    return (
        <div className="viewport-scaler">
            <div className="grid-layout centered fullscreen">
                <div className="chosen-list chosen-left">
                    {renderChosen(chosenAttackers, 'attack')}
                </div>
                <div className="operators-grid">
                    <h2>Attackers</h2>
                    {renderGrid(attackers, 'attack')}
                    <div>
                        {renderTeammateOperators(teamData.attackers)}
                    </div>
                </div>
                <div className="buttons-area">
                    <div className="team-link-ui">
                        <input
                            title="Enter a team code to share your operator choices with others."
                            type="text"
                            placeholder="Enter team code..."
                            value={teamCode}
                            onChange={(e) => setTeamCode(e.target.value)}
                            style={{ padding: "6px", width: "160px" }}
                        />
                    </div>
                    <div>
                        <input
                            title="Enter your name to identify yourself in the team."
                            type="text"
                            placeholder="Your name..."
                            value={myName}
                            onChange={(e) => setMyName(e.target.value)}
                            style={{ padding: "6px", width: "160px", marginBottom: "6px" }}
                        />
                    </div>
                    <div className="team-code-input">
                        <button
                            title="Join a team with a code to share operator choices."
                            onClick={() => {
                                localStorage.setItem("team-code", teamCode);
                                update(ref(db, `teams/${teamCode}/${userUID}`), { name: myName });
                                localStorage.setItem("team-username", myName);
                                window.location.reload();
                            }}
                            style={{ marginLeft: "6px" }}
                        >
                            Join
                        </button>
                        <button
                            title="Generate a new team code to share with others."
                            onClick={() => {
                                const newCode = uuidv4().slice(0, 6);
                                setTeamCode(newCode);
                                update(ref(db, `teams/${teamCode}/${userUID}`), { name: myName });
                                localStorage.setItem("team-username", myName);
                                localStorage.setItem("team-code", newCode);
                            }}
                            style={{ marginLeft: "6px" }}
                        >
                            Generate
                        </button>
                    </div>
                    <div className="spin-controls">
                        <button
                            onClick={handleRollBoth}
                            title="Spin 6 random operators for both sides (Attack & Defense)"
                        >
                            SPIN OPERATORS
                        </button>

                        <label
                            className="allow-dupes-toggle"
                            title="Toggle whether duplicate operators can appear in the same roll."
                            style={{ marginTop: "6px", display: "flex", alignItems: "center", gap: "6px" }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <input
                                type="checkbox"
                                checked={allowDupes}
                                onChange={(e) => setAllowDupes(e.target.checked)}
                            />
                            Allow Dupes
                        </label>
                    </div>
                    <button
                        onClick={resetAll}
                        title="Reset all weights and rerolls, but keep your saved preset (use this to freshen things up)"
                    >
                        RESET ALL
                    </button>

                    <button
                        onClick={handleSavePreset}
                        title="Save your enabled/disabled operator selection. Click operators in the grid to disable them."
                    >
                        SAVE SELECTION
                    </button>

                    <button
                        onClick={handleSaveWeights}
                        title="Save the current operator weights based on usage. You'll see weights adjust as you spin."
                    >
                        SAVE WEIGHTS
                    </button>

                    <button
                        onClick={handleDefaultPreset}
                        title="Reset everything to default: re-enables all operators, resets weights, and overwrites your current save."
                    >
                        DEFAULT SELECTION
                    </button>
                    {feedback && <div className="feedback">{feedback}</div>}
                </div>
                <div className="operators-grid">
                    <h2>Defenders</h2>
                    {renderGrid(defenders, 'defense')}
                    <div style={{ marginTop: "106px" }}>
                        {renderTeammateOperators(teamData.defenders)}
                    </div>
                </div>
                <div className="chosen-list chosen-right">
                    {renderChosen(chosenDefenders, 'defense')}
                </div>
            </div>
        </div>
    );
}

export default OperatorRandomizerUI;