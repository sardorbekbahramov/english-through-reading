import "./globals.css";

export const metadata = {
  title: "English Through Reading — Vocabulary Master",
  description: "Learn English vocabulary from real reading passages with Uzbek and Russian translations",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
