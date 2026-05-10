import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "antd/dist/reset.css";
import "./index.css";
import "./i18n";

createRoot(document.getElementById("root")!).render(<App />);
