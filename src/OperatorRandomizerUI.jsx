import { useEffect, useState } from 'react';
import './App.css';

function OperatorRandomizerUI() {
    const [attackers, setAttackers] = useState([]);
    const [defenders, setDefenders] = useState([]);
    const [chosenAttackers, setChosenAttackers] = useState([]);
    const [chosenDefenders, setChosenDefenders] = useState([]);
    const STORAGE_KEY = "r6-randomizer-disabled";
    const [feedback, setFeedback] = useState("");

    useEffect(() => {
        const defaultWeight = 10;

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
            weight: defaultWeight,
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
    }, []);

    const toggleOperator = (name, role) => {
        const list = role === 'attack' ? attackers : defenders;
        const setList = role === 'attack' ? setAttackers : setDefenders;
        const chosenList = role === 'attack' ? chosenAttackers : chosenDefenders;
        const setChosen = role === 'attack' ? setChosenAttackers : setChosenDefenders;

        const updatedList = list.map(op =>
            op.name === name ? { ...op, enabled: !op.enabled } : op
        );
        setList(updatedList);

        const wasChosen = chosenList.find(op => op.name === name);
        const isNowDisabled = updatedList.find(op => op.name === name)?.enabled === false;

        if (wasChosen && isNowDisabled) {
            // Remove the disabled op
            const filteredChosen = chosenList.filter(op => op.name !== name);

            // Find a replacement candidate that:
            // - is enabled
            // - is not already chosen
            // - is not the one we just removed
            const available = updatedList.filter(op =>
                op.enabled &&
                !filteredChosen.some(c => c.name === op.name)
            );

            let replacement = null;
            if (available.length > 0) {
                replacement = weightedRandom(available);
            }

            // Update chosen list with replacement (if any)
            setChosen(replacement
                ? [...filteredChosen, replacement]
                : filteredChosen
            );
        }
    };

    const removeChosen = (name, role) => {
        const setChosen = role === 'attack' ? setChosenAttackers : setChosenDefenders;
        const chosenList = role === 'attack' ? chosenAttackers : chosenDefenders;

        const updated = chosenList.filter(op => op.name !== name);
        setChosen(updated);
    }

    const weightedRandom = (list) => {
        const pool = list.filter(op => op.enabled);
        const totalWeight = pool.reduce((sum, op) => sum + op.weight, 0);
        const rand = Math.random() * totalWeight;
        let acc = 0;
        for (const op of pool) {
            acc += op.weight;
            if (rand <= acc) return op;
        }
    };

    const rollOperators = (role) => {
        const list = role === 'attack' ? attackers : defenders;
        const setList = role === 'attack' ? setAttackers : setDefenders;
        const setChosen = role === 'attack' ? setChosenAttackers : setChosenDefenders;

        const chosen = [];
        const usedNames = new Set();

        while (chosen.length < 6) {
            const op = weightedRandom(list);
            if (op && !usedNames.has(op.name)) {
                usedNames.add(op.name);
                chosen.push(op);
            }
        }

        const updatedList = list.map(op => {
            if (!op.enabled) return op;
            if (usedNames.has(op.name)) {
                return { ...op, weight: Math.max(1, op.weight - 1) };
            } else {
                return { ...op, weight: op.weight + 1 };
            }
        });

        setList(updatedList);
        setChosen(chosen);
    };

    const resetAll = () => {
        const preset = JSON.parse(localStorage.getItem(STORAGE_KEY));

        if (preset) {
            setAttackers(prev => loadDisabledOperators(prev.map(op => ({ ...op, weight: 10 })), 'attack', preset));
            setDefenders(prev => loadDisabledOperators(prev.map(op => ({ ...op, weight: 10 })), 'defense', preset));
        } else {
            const reset = list => list.map(op => ({ ...op, enabled: true, weight: 10 }));
            setAttackers(prev => reset(prev));
            setDefenders(prev => reset(prev));
        }

        setChosenAttackers([]);
        setChosenDefenders([]);
    };

    const renderGrid = (list, role) => (
        <div className="grid-operators">
            {list.map(op => (
                <div
                    key={op.name}
                    className={`op-icon ${op.enabled ? '' : 'disabled'}`}
                    onClick={() => toggleOperator(op.name, role)}
                >
                    <span className="op-weight">{op.weight}</span>
                    <img src={op.image} alt={op.name} />
                </div>
            ))}
        </div>
    );

    const renderChosen = (list, role) => (
        <div className="chosen-operators">
            {list.map(op => (
                <div
                    key={op.name}
                    className="chosen-icon"
                    onClick={() => removeChosen(op.name, role)}
                    title="Click to remove"
                >
                    <img src={op.image} alt={op.name} />
                </div>
            ))}
        </div>
    );

    const saveDisabledOperators = (attackers, defenders) => {
        const data = {
            attack: attackers.filter(op => !op.enabled).map(op => op.name),
            defense: defenders.filter(op => !op.enabled).map(op => op.name)
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    };

    const loadDisabledOperators = (ops, role, preset) =>
        ops.map(op => ({
            ...op,
            enabled: !preset[role].includes(op.name)
        }));

    const showFeedback = (message) => {
        setFeedback(message);
        setTimeout(() => setFeedback(""), 2000); // Clears after 2 seconds
    };

    const handleSavePreset = () => {
        saveDisabledOperators(attackers, defenders);
        showFeedback("Preset saved!");
    };

    const handleLoadPreset = () => {
        try {
            const preset = JSON.parse(localStorage.getItem(STORAGE_KEY));
            if (!preset || !preset.attack || !preset.defense) {
                showFeedback("No saved preset found.");
                return;
            }

            setAttackers(prev => loadDisabledOperators(prev, 'attack', preset));
            setDefenders(prev => loadDisabledOperators(prev, 'defense', preset));
            showFeedback("Preset loaded!");
        } catch (err) {
            console.warn("Failed to load preset:", err);
            showFeedback("Failed to load preset.");
        }
    };

    const handleDefaultPreset = () => {
        setAttackers(prev => prev.map(op => ({ ...op, enabled: true })));
        setDefenders(prev => prev.map(op => ({ ...op, enabled: true })));
        showFeedback("Default preset applied!");
    };

    return (
        <div className="grid-layout centered fullscreen">
            <div className="chosen-list chosen-left">
                {renderChosen(chosenAttackers, 'attack')}
            </div>
            <div className="operators-grid">
                <h2>Attackers</h2>
                {renderGrid(attackers, 'attack')}
            </div>
            <div className="buttons-area">
                <button onClick={() => { rollOperators('attack'); rollOperators('defense'); }}>SPIN</button>
                <button onClick={resetAll}>RESET</button>
                <button onClick={handleSavePreset}>SAVE</button>
                <button onClick={handleLoadPreset}>LOAD</button>
                <button onClick={handleDefaultPreset}>DEFAULT</button>
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
    );
}

export default OperatorRandomizerUI;