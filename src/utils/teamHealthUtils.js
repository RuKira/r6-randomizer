import { operatorRoles } from "./roleMap";

export function analyzeTeamComposition(team, side) {
    const roleCounts = {};

    team.forEach(op => {
        const name = (op.name || "").trim();
        const roles = operatorRoles[name] || [];

        roles.forEach(role => {
            roleCounts[role] = (roleCounts[role] || 0) + 1;
        });
    });

    const alerts = [];

    if (side === "attack") {
        if ((roleCounts["Breach"] || 0) < 2) {
            alerts.push("❌ Not enough Hard Breachers (need 2+)");
        }
        if ((roleCounts["Anti-Gadget"] || 0) < 2) {
            alerts.push("❌ Not enough Anti-Gadget operators (need 2+)");
        }
    }

    if (side === "defense") {
        if ((roleCounts["Anti-Entry"] || 0) < 2) {
            alerts.push("❌ Not enough Anti-Entry operators (need 2+)");
        }
    }

    if (alerts.length === 0) {
        alerts.push("✅ Balanced Team Setup");
    }

    return alerts;
}
