// Cache-bust: forces a new hashed bundle filename so browsers that cached
// the temporary www<->apex redirect loop (PRs #17-#20) stop replaying it.
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
