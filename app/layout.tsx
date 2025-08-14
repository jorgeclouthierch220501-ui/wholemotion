export const metadata = {
  title: "Fitness MVP (No AI)",
  description: "Calorie log + rule-based diet/workout generator with USDA integration"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "Inter, system-ui, Arial", margin: 0, background: "#0b0b0c", color: "#fff" }}>
        {children}
      </body>
    </html>
  );
}
