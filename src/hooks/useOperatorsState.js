import {useEffect, useState} from 'react';
import {buildOps, loadDisabledOperators} from '../utils/operatorUtils'; // Adjust the import path as necessary

// Safely builds operator objects only if names is a valid array

export function useOperatorsState(storageKey, attackerNames, defenderNames) {
    const buildOpsSafe = (names, role) => Array.isArray(names) ? buildOps(names, role) : [];
    const [attackers, setAttackers] = useState(buildOpsSafe(attackerNames, 'attack'));
    const [defenders, setDefenders] = useState(buildOpsSafe(defenderNames, 'defense'));

    useEffect(() => {
        const baseAttackers = buildOpsSafe(attackerNames, 'attack');
        const baseDefenders = buildOpsSafe(defenderNames, 'defense');

        const saved = JSON.parse(localStorage.getItem(storageKey));
        if (saved) {
            setAttackers(loadDisabledOperators(baseAttackers, 'attack', saved));
            setDefenders(loadDisabledOperators(baseDefenders, 'defense', saved));
        } else {
            setAttackers(baseAttackers);
            setDefenders(baseDefenders);
        }
    }, [attackerNames, defenderNames, storageKey]);

    const reloadOperatorsFromPreset = (ignoreWeights = false) => {
        const baseAttackers = buildOpsSafe(attackerNames, 'attack');
        const baseDefenders = buildOpsSafe(defenderNames, 'defense');

        const saved = JSON.parse(localStorage.getItem(storageKey));
        if (saved) {
            setAttackers(loadDisabledOperators(baseAttackers, 'attack', saved, ignoreWeights));
            setDefenders(loadDisabledOperators(baseDefenders, 'defense', saved, ignoreWeights));
        } else {
            setAttackers(baseAttackers);
            setDefenders(baseDefenders);
        }
    };

    return {
        attackers, setAttackers, defenders, setDefenders, reloadOperatorsFromPreset
    };
}