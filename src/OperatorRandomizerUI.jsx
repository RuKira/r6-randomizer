import { useEffect, useState } from 'react';
import './App.css';

function OperatorRandomizerUI() {
    const [attackers, setAttackers] = useState([]);
    const [defenders, setDefenders] = useState([]);
    const [chosenAttackers, setChosenAttackers] = useState([]);
    const [chosenDefenders, setChosenDefenders] = useState([]);

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
            image: `/images/operators/${name.toLowerCase().replace(/[^a-z0-9]/gi, '')}.png`
        }));

        setAttackers(buildOps(attackerNames, 'attack'));
        setDefenders(buildOps(defenderNames, 'defense'));
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
        const reset = list => list.map(op => ({ ...op, enabled: true, weight: 10 }));
        setAttackers(prev => reset(prev));
        setDefenders(prev => reset(prev));
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

    const renderChosen = (list) => (
        <div className="chosen-operators">
            {list.map(op => (
                <div key={op.name} className="chosen-icon">
                    <img src={op.image} alt={op.name} />
                </div>
            ))}
        </div>
    );

    return (
        <div className="grid-layout centered fullscreen">
            <div className="chosen-list chosen-left">
                {renderChosen(chosenAttackers)}
            </div>
            <div className="operators-grid">
                <h2>Attackers</h2>
                {renderGrid(attackers, 'attack')}
            </div>
            <div className="buttons-area">
                <button onClick={() => { rollOperators('attack'); rollOperators('defense'); }}>SPIN</button>
                <button onClick={resetAll}>RESET</button>
            </div>
            <div className="operators-grid">
                <h2>Defenders</h2>
                {renderGrid(defenders, 'defense')}
            </div>
            <div className="chosen-list chosen-right">
                {renderChosen(chosenDefenders)}
            </div>
        </div>
    );
}

export default OperatorRandomizerUI;