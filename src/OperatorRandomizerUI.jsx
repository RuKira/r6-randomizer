import { useEffect, useRef, useState } from 'react';
import './App.css';

function OperatorRandomizerUI() {
    const layoutRef = useRef();
    const [attackers, setAttackers] = useState([]);
    const [defenders, setDefenders] = useState([]);
    const [chosenAttackers, setChosenAttackers] = useState([]);
    const [chosenDefenders, setChosenDefenders] = useState([]);
    const STORAGE_KEY = "r6-randomizer-preset";
    const [feedback, setFeedback] = useState("");
    const [lockedAttackers, setLockedAttackers] = useState([]);
    const [lockedDefenders, setLockedDefenders] = useState([]);
    const [rerolledAttackers, setRerolledAttackers] = useState([]);
    const [rerolledDefenders, setRerolledDefenders] = useState([]);
    const [playedAttackers, setPlayedAttackers] = useState([]);
    const [playedDefenders, setPlayedDefenders] = useState([]);
    const [fadingReroll, setFadingReroll] = useState(null);
    const [allowDupes, setAllowDupes] = useState(false);
    const [weightChanges, setWeightChanges] = useState({});


    useEffect(() => {
        const baseHeight = 1080;

        // scaling effect
        const scaleLayout = () => {
            const height = window.innerHeight;
            const scale = Math.min(height / baseHeight, 1);
            if (layoutRef.current) {
                layoutRef.current.style.transform = `scale(${scale})`;
            }
        };

        scaleLayout();
        window.addEventListener('resize', scaleLayout);

        // preset loading
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

        const buildOps = (names, role) => names.map(name => ({
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
    };

    const toggleOperator = (name, role) => {
        const list = role === 'attack' ? attackers : defenders;
        const setList = role === 'attack' ? setAttackers : setDefenders;
        const chosenList = role === 'attack' ? chosenAttackers : chosenDefenders;

        const updatedList = list.map(op =>
            op.name === name ? { ...op, enabled: !op.enabled } : op
        );
        setList(updatedList);

        const wasChosen = chosenList.find(op => op.name === name);
        const isNowDisabled = updatedList.find(op => op.name === name)?.enabled === false;

        if (wasChosen && isNowDisabled) {
            rerollOperator(name, role); // true = from disable
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

        // Re-enable temporarily disabled operators (not in preset)
        let cleanedList = list.map(op => {
            if (!op.enabled && !savedDisabled.includes(op.name)) {
                return { ...op, enabled: true };
            }
            return op;
        });

        // Start with locked choices
        const originalList = [...cleanedList];
        const lockedOps = chosen.filter(op => locked.includes(op.name));
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
                    key={op.name}
                    title={op.name}
                    className={`op-icon ${op.enabled ? '' : 'disabled'}
                        ${weightChanges[op.name] === 'up' ? 'weight-up' : ''}
                        ${weightChanges[op.name] === 'down' ? 'weight-down' : ''}
                        ${weightChanges[op.name] === 'hold' ? 'weight-hold' : ''}
                    `}
                    onClick={() => toggleOperator(op.name, role)}
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

            setFadingReroll(null);
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
            weight: weightsMap.has(op.name) ? weightsMap.get(op.name) : 5
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
                </div>
                <div className="buttons-area">
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
                </div>
                <div className="chosen-list chosen-right">
                    {renderChosen(chosenDefenders, 'defense')}
                </div>
            </div>
        </div>
    );
}

export default OperatorRandomizerUI;