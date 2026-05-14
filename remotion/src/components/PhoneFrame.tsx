import React from "react";
import { theme } from "../theme";

export const PhoneFrame: React.FC<{ children: React.ReactNode; status?: string }> = ({
  children,
  status = "9:41",
}) => {
  return (
    <div
      style={{
        width: 760,
        height: 1500,
        borderRadius: 80,
        background: "#000",
        padding: 14,
        boxShadow: "0 60px 120px rgba(0,0,0,0.55), 0 0 0 2px rgba(255,255,255,0.06)",
        position: "relative",
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: 68,
          background: theme.cardSoft,
          overflow: "hidden",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 70,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 50px",
            color: theme.ink,
            fontFamily: "Inter, sans-serif",
            fontWeight: 600,
            fontSize: 22,
            zIndex: 5,
          }}
        >
          <span>{status}</span>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: 16 }}>●●●●</span>
            <span style={{ fontSize: 16 }}>100%</span>
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            top: 18,
            left: "50%",
            transform: "translateX(-50%)",
            width: 200,
            height: 36,
            background: "#000",
            borderRadius: 20,
            zIndex: 6,
          }}
        />
        <div style={{ position: "absolute", inset: 0, paddingTop: 80 }}>{children}</div>
      </div>
    </div>
  );
};
