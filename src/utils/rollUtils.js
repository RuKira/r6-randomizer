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
                                   list,
                                   setList,
                                   allowDupes,
                                   setWeightChanges,
                                   setRerolled,
                                   played
                               }) => {
    const oldOp = chosen.find(op => op.uid === uid);
    if (!oldOp) return;

    if (Array.isArray(played) && played.includes(uid)) {
        return;
    }

    const usedNames = new Set(chosen.map(op => op.name));
    if (allowDupes) usedNames.delete(oldOp.name);

    const pool = list.filter(op =>
        op.enabled && (allowDupes || !usedNames.has(op.name))
    );

    if (pool.length === 0) {
        return;
    }

    const newOp = weightedRandom(pool);
    if (!newOp) return;

    const newUid = `${newOp.name}-${Date.now()}`;
    const updatedChosen = chosen.map(op =>
        op.uid === uid
            ? { ...newOp, uid: newUid }
            : op
    );


    const updatedList = list.map(op => {
        if (op.name === oldOp.name) {
            return { ...op, weight: Math.min(15, op.weight + 2) };
        }
        if (op.name === newOp.name) {
            return { ...op, weight: Math.max(1, op.weight - 5) };
        }
        return op;
    });

    const changes = {
        [oldOp.name]: 'up',
        [newOp.name]: 'down'
    };

    setChosen(updatedChosen);
    setList(updatedList);
    setWeightChanges(prev => ({ ...prev, ...changes }));
    if (setWeightChanges) {
        setTimeout(() => setWeightChanges({}), 1000);
    }

    setRerolled(prev => [...prev, newUid]);
};
