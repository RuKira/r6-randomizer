import { useState } from "react";

export default function SavePresetModal({ onSave, onClose }) {
    const [name, setName] = useState("");

    function handleSave() {
        if (name.trim()) {
            onSave(name.trim());
            onClose();
        }
    }

    return (
        <div className="modal-backdrop">
            <div className="modal">
                <h3>Save Preset</h3>
                <input
                    type="text"
                    value={name}
                    placeholder="Preset Name"
                    onChange={(e) => setName(e.target.value)}
                />
                <div className="modal-actions">
                    <button onClick={handleSave}>Save</button>
                    <button onClick={onClose}>Cancel</button>
                </div>
            </div>
        </div>
    );
}
