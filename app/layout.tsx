import './globals.css';
import Navbar from './components/Navbar'; // <--- Importamos tu nuevo menú

export const metadata = {
  title: 'Sistema de Vacaciones',
  description: 'Control de recursos y proyectos',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="bg-gray-50">
        {/* Aquí ponemos el menú para que salga siempre arriba */}
        <Navbar />
        
        {/* Aquí se renderiza la página que estés visitando (Home, Admin, Login) */}
        <main>
          {children}
        </main>
      </body>
    </html>
  );
}