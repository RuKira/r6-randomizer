export const STORAGE_KEY = "r6-randomizer-preset";

// ADD COMMENTS TO EXPLAIN THE FUNCTIONALITY

export const buildOps = (names, role) => {
    const sanitize = (str) => str.toLowerCase().replace(/[^a-z0-9]/gi, '');
    if (!Array.isArray(names)) return [];

    const ops = names.map((name) => ({
        uid: `${role}-${sanitize(name)}`,
        name,
        role,
        weight: 5,
        enabled: true,
        image: `images/operators/${sanitize(name)}.png`
    }));

    if (role === 'attack' || role === 'defense') {
        ops.push({
            uid: `Wildcard-${role}`,
            name: 'Wildcard',
            role,
            enabled: true,
            weight: 10,
            image: 'images/operators/wildcard.png',
            hidden: true
        });
    }

    return ops;
};

// ADD COMMENTS TO EXPLAIN THE FUNCTIONALITY

export const weightedRandom = (list) => {
    const pool = [];
    for (const op of list) {
        if (op.enabled) {
            for (let i = 0; i < op.weight; i++) pool.push(op);
        }
    }
    if (pool.length === 0) return null;
    for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool[0];
};

// ADD COMMENTS TO EXPLAIN THE FUNCTIONALITY

/**
 * Save disabled operators (and optionally weights) to localStorage.
 * Hidden ops (e.g., Wildcard) are ALWAYS skipped.
 *
 * @param {Array} attackers
 * @param {Array} defenders
 * @param {boolean} saveWeights - if true, also persist weights
 */
export function saveDisabledOperators(attackers, defenders, saveWeights = false) {
    const disabledAttack = attackers.filter(op => !op.hidden && !op.enabled).map(op => op.name);
    const disabledDefense = defenders.filter(op => !op.hidden && !op.enabled).map(op => op.name);

    const preset = {
        attack: disabledAttack, defense: disabledDefense
    };

    if (saveWeights) {
        const attackWeights = Object.fromEntries(attackers.filter(op => !op.hidden).map(op => [op.name, op.weight]));
        const defenseWeights = Object.fromEntries(defenders.filter(op => !op.hidden).map(op => [op.name, op.weight]));

        preset.weights = {
            attack: attackWeights, defense: defenseWeights
        };
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(preset));
}

// ADD COMMENTS TO EXPLAIN THE FUNCTIONALITY

/**
 * Apply a saved preset to a given list.
 * Hidden ops (e.g., Wildcard) are returned untouched.
 *
 * @param {Array} list - current list (attackers or defenders)
 * @param {'attack'|'defense'} role
 * @param {Object} preset - parsed object from localStorage.getItem(STORAGE_KEY)
 * @param {boolean} forceEnableAll - if true, ignore disabled list and enable everything
 * @returns {Array} updated list
 */
export function loadDisabledOperators(list, role, preset, forceEnableAll = false) {
    const savedDisabled = Array.isArray(preset?.[role]) ? preset[role] : [];
    const savedWeights = preset?.weights?.[role] || null;

    return list.map(op => {
        if (op.hidden) return op;

        const next = {
            ...op, enabled: forceEnableAll ? true : !savedDisabled.includes(op.name)
        };

        if (savedWeights && savedWeights[op.name] != null) {
            next.weight = savedWeights[op.name];
        }

        return next;
    });
}

// ADD COMMENTS TO EXPLAIN THE FUNCTIONALITY

export function toggleOperator({
                                   uid,
                                   role,
                                   list,
                                   setList,
                                   chosenList,
                                   setChosen,
                                   setRerolled,
                                   allowDupes,
                                   setWeightChanges,
                                   playedList
                               }) {
    const clickedOp = list.find(op => op.uid === uid);
    if (!clickedOp) return;
    if (clickedOp.hidden) return;

    const playedUIDs = new Set(playedList || []);

    if (playedUIDs.has(uid)) {
        console.log("⛔ Blocked toggle/reroll/disable for played operator:", clickedOp.name, uid);
        return;
    }

    const nameToToggle = clickedOp.name;
    const isCurrentlyEnabled = clickedOp.enabled;

    const rerolledUIDs = [];
    let updatedChosen = [...chosenList];

    if (isCurrentlyEnabled) {
        const usedNames = new Set(chosenList.map(op => op.name));

        updatedChosen = chosenList.map(op => {
            if (playedUIDs.has(op.uid)) {
                return op;
            }

            if (op.name !== nameToToggle) return op;

            const pool = list.filter(p => p.enabled && (allowDupes || !usedNames.has(p.name)) && p.name !== nameToToggle && !playedUIDs.has(p.uid));

            const newOp = weightedRandom(pool);
            if (!newOp) {
                rerolledUIDs.push(op.uid);
                return op;
            }

            const newUid = `${newOp.name}-${Date.now()}`;
            rerolledUIDs.push(newUid);
            usedNames.add(newOp.name);
            return {...newOp, uid: newUid};
        });

        setChosen(updatedChosen);

        if (setRerolled && rerolledUIDs.length > 0) {
            setRerolled(prev => [...prev, ...rerolledUIDs]);
        }
    }

    const updatedList = list.map(op => op.name === nameToToggle && !playedUIDs.has(op.uid) ? {
        ...op,
        enabled: !isCurrentlyEnabled
    } : op);

    setList(updatedList);

    if (setWeightChanges) {
        setTimeout(() => setWeightChanges({}), 1000);
    }
}




