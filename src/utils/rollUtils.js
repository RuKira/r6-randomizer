import { weightedRandom } from "./operatorUtils.js";

export function rollOperatorsForRole({
                                         role,
                                         list,
                                         chosen,
                                         locked,
                                         setList,
                                         setChosen,
                                         setWeightChanges,
                                         setLocked,
                                         setRerolled,
                                         setPlayed,
                                         allowDupes,
                                         sync
                                     }) {
    const STORAGE_KEY = "r6-randomizer-preset";

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

        cleanedList = cleanedList.map(o =>
            o.name === op.name ? { ...o, weight: Math.max(1, o.weight - 5) } : o
        );
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
            newWeightChanges[oldOp.name] = 'hold';
        }
    });

    setWeightChanges(prev => ({ ...prev, ...newWeightChanges }));
    setList(finalList);
    setChosen(result);
    setTimeout(() => setWeightChanges({}), 1000);

    setLocked(prev => prev.filter(name => usedNames.has(name)));
    setRerolled(prev => prev.filter(name => !usedNames.has(name)));
    setPlayed(prev => prev.filter(name => !usedNames.has(name)));

    if (typeof sync === "function") {
        sync();
    }
}

export const rerollOperator = ({
                                   uid,
                                   chosen,
                                   setChosen,
                                   setList,
                                   allowDupes,
                                   list,
                                   setWeightChanges,
                                   setRerolled
                               }) => {
    const index = chosen.findIndex(op => op.uid === uid);
    const oldOp = chosen[index];
    if (index === -1 || !oldOp) return;

    // Build a pool excluding already chosen names (if no dupes)
    const usedNames = new Set(chosen.map(op => op.name));
    if (allowDupes) usedNames.delete(oldOp.name); // let this operator's name reroll again

    const pool = list.filter(op =>
        op.enabled && (allowDupes || !usedNames.has(op.name))
    );

    const newOp = weightedRandom(pool);
    if (!newOp) return;

    const updatedOp = { ...newOp, uid: `${newOp.name}-${Date.now()}` };

    // Replace operator at the same index
    const newChosen = [...chosen];
    newChosen[index] = updatedOp;
    setChosen(newChosen);

    // Adjust weights
    const updatedList = list.map(op => {
        if (op.name === newOp.name) {
            return { ...op, weight: Math.max(1, op.weight - 5) };
        }
        if (op.name === oldOp.name) {
            return { ...op, weight: Math.min(15, op.weight + 2) };
        }
        return op;
    });

    setList(updatedList);

    // Show weight change arrows briefly
    const changes = {
        [oldOp.name]: 'up',
        [newOp.name]: 'down'
    };
    setWeightChanges(prev => ({ ...prev, ...changes }));
    setTimeout(() => setWeightChanges({}), 1000);

    // Track rerolled operator
    setRerolled(prev => [
        ...prev.filter(id => id !== uid),
        updatedOp.uid
    ]);
};
