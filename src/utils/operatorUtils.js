// ADD COMMENTS TO EXPLAIN THE FUNCTIONALITY

export const buildOps = (names, role) => {
    const sanitize = (str) => str.toLowerCase().replace(/[^a-z0-9]/gi, '');
    if (!Array.isArray(names)) return [];

    return names.map((name) => ({
        uid: `${role}-${sanitize(name)}`,
        name,
        role,
        weight: 5,
        enabled: true,
        image: `images/operators/${sanitize(name)}.png`
    }));
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

export const saveDisabledOperators = (attackers, defenders, includeWeights = false) => {
    const data = {
        attack: attackers.filter(op => !op.enabled).map(op => op.name),
        defense: defenders.filter(op => !op.enabled).map(op => op.name),
    };

    if (includeWeights) {
        data.attackWeights = attackers.map(op => ({ name: op.name, weight: op.weight }));
        data.defenseWeights = defenders.map(op => ({ name: op.name, weight: op.weight }));
    }

    localStorage.setItem("r6-randomizer-preset", JSON.stringify(data));
};

// ADD COMMENTS TO EXPLAIN THE FUNCTIONALITY

export const loadDisabledOperators = (ops, role, preset, ignoreWeights = false) => {
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

// ADD COMMENTS TO EXPLAIN THE FUNCTIONALITY

export function toggleOperator({
                                   uid,
                                   list,
                                   setList,
                                   chosenList,
                                   setChosen,
                                   setRerolled,
                                   allowDupes,
                                   setWeightChanges
                               }) {
    const clickedOp = list.find(op => op.uid === uid);
    if (!clickedOp) return;

    const nameToToggle = clickedOp.name;
    const isCurrentlyEnabled = clickedOp.enabled;

    const rerolledUIDs = [];
    let updatedChosen = [...chosenList];

    if (isCurrentlyEnabled) {
        const usedNames = new Set(chosenList.map(op => op.name));

        updatedChosen = chosenList.map(op => {
            if (op.name !== nameToToggle) return op;

            const pool = list.filter(p =>
                p.enabled &&
                (allowDupes || !usedNames.has(p.name)) &&
                p.name !== nameToToggle
            );

            const newOp = weightedRandom(pool);
            if (!newOp) {
                rerolledUIDs.push(op.uid);
                return op;
            }

            const newUid = `${newOp.name}-${Date.now()}`;
            rerolledUIDs.push(newUid);
            usedNames.add(newOp.name);
            return { ...newOp, uid: newUid };
        });

        setChosen(updatedChosen);

        if (setRerolled && rerolledUIDs.length > 0) {
            setRerolled(prev => [...prev, ...rerolledUIDs]);
        }
    }

    const updatedList = list.map(op =>
        op.name === nameToToggle ? { ...op, enabled: !isCurrentlyEnabled } : op
    );

    setList(updatedList);

    if (setWeightChanges) {
        setTimeout(() => setWeightChanges({}), 1000);
    }
}





