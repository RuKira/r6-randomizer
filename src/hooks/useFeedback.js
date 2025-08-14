import { useState } from "react";

export function useFeedback() {
    const [feedback, setFeedback] = useState("");
    const showFeedback = (message) => {
        setFeedback(message);
        setTimeout(() => setFeedback(""), 2000);
    };
    return { feedback, showFeedback };
}
