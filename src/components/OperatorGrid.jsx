import '../styles/grid.css';

// ADD COMMENTS TO EXPLAIN THE FUNCTIONALITY

export default function OperatorGrid({ list, role, toggleOperator, weightChanges }) {
    const placeholders = role === 'defense'
        ? Array(0).fill(null).map((_, i) => ({
            uid: `placeholder-${role}-${i}`,
            name: "",
            role,
            enabled: false,
            weight: 0,
            image: "",
            placeholder: true
        }))
        : [];

    const fullList = [...list, ...placeholders];

    return (
        <div className="grid-operators">
            {fullList.map((op) => (
                <div
                    key={op.uid}
                    title={op.name}
                    className={`
                        op-icon
                        ${op.enabled === false ? 'disabled' : ''}
                        ${weightChanges[op.name] === 'up' ? 'weight-up' : ''}
                        ${weightChanges[op.name] === 'down' ? 'weight-down' : ''}
                        ${weightChanges[op.name] === 'hold' ? 'weight-hold' : ''}
                        ${op.placeholder ? 'placeholder' : ''}
                    `}
                    onClick={() => !op.placeholder && toggleOperator(op.uid, role)}
                >
                    {!op.placeholder && op.enabled && (
                        <span className="op-weight">{op.weight}</span>
                    )}
                    {!op.placeholder && (
                        <img src={op.image} alt={op.name} />
                    )}
                </div>
            ))}
        </div>
    );
}