import React from "react";
import ReactDOM from "react-dom/client";
import { AuthGate } from "./secureClient.jsx";
import AdminApp from "./AdminCrepisimo.jsx";
ReactDOM.createRoot(document.getElementById("root")).render(React.createElement(AuthGate,{admin:true},React.createElement(AdminApp)));
