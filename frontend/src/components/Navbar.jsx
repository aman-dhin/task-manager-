import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="navbar">
      <div className="container navbar__inner">
        <a className="brand" href="/">
          <span className="brand__mark" aria-hidden="true">
            <span></span>
            <span></span>
            <span></span>
          </span>
          Taskrail
        </a>

        {user && (
          <div className="navbar__user">
            <span className="navbar__user-name">
              Hi, <strong>{user.name.split(' ')[0]}</strong>
            </span>
            <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
              Log out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
