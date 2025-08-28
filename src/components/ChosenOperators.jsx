import '../styles/chosen.css';

// Renders your chosen operator list with state badges (locked, rerolled, played) and swap interaction on image click.
export default function ChosenList({
	list,
	role,
	locked,
	rerolled,
	played,
	fadingReroll,
	removingAttackers,
	removingDefenders,
	rerollOperator,
	toggleLock,
	removeChosen,
	onPickForSwap,
	swappableUid,
}) {
	const sortedList = [...list].sort((a, b) => {
		const aPlayed = played.includes(a.uid);
		const bPlayed = played.includes(b.uid);
		if (aPlayed && !bPlayed) return 1;
		if (!aPlayed && bPlayed) return -1;
		return 0;
	});

	return (
		<div className="chosen-operators">
			{sortedList.map((op, idx) => {
				const isLocked = locked.includes(op.uid);
				const isRerolled = rerolled.includes(op.uid);
				const isPlayed = played.includes(op.uid);
				const isFading = fadingReroll === op.uid;
				const isRemoving = (
					role === 'attack'
						? removingAttackers.includes(op.uid)
						: removingDefenders.includes(op.uid)
				);
				const isSwappable = swappableUid === op.uid;

				let statusClass = '';
				if (isPlayed) {
					statusClass = 'played';
				} else if (isSwappable) {
					statusClass = 'swappable';
				} else if (isLocked) {
					statusClass = 'locked';
				} else if (isRerolled) {
					statusClass = 'rerolled';
				}

				return (
					<div
						key={op.uid || `${op.name}-${idx}`}
						className={`chosen-icon 
							${statusClass}
              ${(isFading || isRemoving) ? '' : ''}
            `}
					>
						<img
							src={op.image}
							alt={op.name}
							title={op.name}
							onClick={() => !isPlayed && onPickForSwap(op.uid)}
						/>
						<div className="chosen-buttons">
							<button
								onClick={(e) => { e.stopPropagation(); rerollOperator(op.uid, role); }}
								title="Reroll"
								disabled={isPlayed}
							>🔁</button>
							<button
								onClick={(e) => { e.stopPropagation(); toggleLock(op.uid, role); }}
								title={isLocked ? "Unlock" : "Lock"}
								disabled={isPlayed}
							>
								{isLocked ? "🔓" : "🔒"}
							</button>
							<button
								onClick={(e) => { e.stopPropagation(); removeChosen(op.uid, role); }}
								title="Played (Remove)"
								disabled={isPlayed}
							>✅</button>
						</div>
					</div>
				);
			})}
		</div>
	);
}
