export default function SecurityPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #fff7ed 0%, #ffffff 45%)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "40px 16px",
      }}
    >
      <div
        style={{
          maxWidth: "1100px",
          width: "100%",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "32px",
        }}
      >
        {/* ================= LEFT: SECURITY ================= */}
        <div
          style={{
            background: "white",
            borderRadius: "22px",
            padding: "40px",
            boxShadow: "0 20px 40px rgba(0,0,0,0.08)",
            border: "1px solid #fed7aa",
          }}
        >
          <h1
            style={{
              fontSize: "26px",
              fontWeight: "700",
              marginBottom: "10px",
              color: "#9a3412",
            }}
          >
            🔐 Token Security
          </h1>

          <p
            style={{
              color: "#555",
              fontSize: "15px",
              marginBottom: "26px",
            }}
          >
            Your Moodle token is treated like a password — protected at every step.
          </p>

          <div style={{ display: "grid", gap: "14px" }}>
            {[
              "Token is encrypted before storage",
              "Database never sees the real token",
              "Only server-side code can use it",
              "Token is never shared with anyone",
              "You can refresh the token anytime",
            ].map((text, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "14px 18px",
                  borderRadius: "12px",
                  background: "#fff7ed",
                  border: "1px solid #fed7aa",
                }}
              >
                <span style={{ fontSize: "18px" }}>✔️</span>
                <span style={{ fontSize: "15px", color: "#1f2937" }}>
                  {text}
                </span>
              </div>
            ))}
          </div>

          <div
            style={{
              marginTop: "26px",
              padding: "16px 18px",
              borderRadius: "14px",
              background:
                "linear-gradient(135deg, #ffedd5, #fed7aa)",
              border: "1px solid #fdba74",
              fontSize: "14px",
              color: "#7c2d12",
            }}
          >
            🔒 Even if the database was compromised, the stored token would
            be unreadable and useless.
          </div>
        </div>

        {/* ================= RIGHT: HOW TO GET TOKEN ================= */}
        <div
          style={{
            background: "white",
            borderRadius: "22px",
            padding: "40px",
            boxShadow: "0 20px 40px rgba(0,0,0,0.08)",
            border: "1px solid #fed7aa",
          }}
        >
          <h2
            style={{
              fontSize: "24px",
              fontWeight: "700",
              marginBottom: "16px",
              color: "#9a3412",
            }}
          >
            🧭 How to get your Moodle token
          </h2>

          <p
            style={{
              fontSize: "15px",
              color: "#555",
              marginBottom: "22px",
            }}
          >
            Takes less than a minute.
          </p>

          <div style={{ display: "grid", gap: "14px" }}>
            {[
              "Log in to your Moodle account",
              "Click the down arrow in the top-right",
              "Open Preferences",
              "Go to Security keys",
              "Copy “Moodle mobile web service”",
            ].map((step, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: "14px",
                  alignItems: "flex-start",
                  padding: "14px 18px",
                  borderRadius: "12px",
                  background: "#fff7ed",
                  border: "1px solid #fed7aa",
                }}
              >
                <div
                  style={{
                    minWidth: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    background: "#f97316",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "14px",
                    fontWeight: "700",
                  }}
                >
                  {i + 1}
                </div>

                <span style={{ fontSize: "15px", color: "#1f2937" }}>
                  {step}
                </span>
              </div>
            ))}
          </div>

          <div
            style={{
              marginTop: "26px",
              fontSize: "14px",
              color: "#7c2d12",
            }}
          >
            Paste this token into TaskFlow when connecting Moodle.
          </div>
        </div>
      </div>
    </div>
  );
}
