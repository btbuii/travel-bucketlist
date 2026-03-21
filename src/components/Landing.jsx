import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiMapPin, FiLogIn, FiLogOut, FiUser, FiLoader, FiX, FiArrowRight } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { fetchAllProfiles, createProfile } from '../hooks/useProfile';
import LoginModal from './LoginModal';

export default function Landing() {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [setupUsername, setSetupUsername] = useState('');
  const [setupDisplay, setSetupDisplay] = useState('');
  const [setupError, setSetupError] = useState('');

  useEffect(() => {
    fetchAllProfiles()
      .then(setProfiles)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!user || (profiles.length === 0 && loading)) return;
    const myProfile = profiles.find((p) => p.id === user.id);
    if (myProfile) {
      navigate(`/${myProfile.username}`);
    } else {
      setShowSetup(true);
    }
  }, [user, profiles, loading, navigate]);

  const handleCreateProfile = async (e) => {
    e.preventDefault();
    if (!setupUsername.trim()) return;
    setSetupError('');
    try {
      const slug = await createProfile(user.id, setupUsername.trim(), setupDisplay.trim());
      setShowSetup(false);
      const updated = await fetchAllProfiles();
      setProfiles(updated);
      navigate(`/${slug}`);
    } catch (err) {
      setSetupError(err.message?.includes('duplicate') ? 'Username already taken' : err.message);
    }
  };

  const myProfile = user ? profiles.find((p) => p.id === user.id) : null;

  if (authLoading || loading) {
    return <div className="loading-screen"><FiLoader size={28} className="spinner" /><p>Loading...</p></div>;
  }

  return (
    <div className="landing-page">
      <nav className="topnav">
        <Link to="/" className="topnav-brand">global.io</Link>
        <div className="topnav-center" />
        <div className="topnav-right">
          {!user && (
            <button className="topnav-btn" onClick={() => setShowLogin(true)}>
              <FiLogIn size={12} /> Sign in
            </button>
          )}
          {user && (
            <>
              {myProfile && (
                <Link to={`/${myProfile.username}`} className="topnav-link">My Profile</Link>
              )}
              <button className="topnav-btn" onClick={signOut}><FiLogOut size={12} /> Sign out</button>
            </>
          )}
        </div>
      </nav>

      <div className="landing-content">
        <div className="landing-main">
          <div className="landing-hero">
            <h1>global.io</h1>
            <p>Create and share your personal travel portfolio. Document the places you've been, the food you've tried, and the adventures still on your list.</p>
            {!user && (
              <button className="landing-cta" onClick={() => setShowLogin(true)}>
                Get Started <FiArrowRight size={16} />
              </button>
            )}
            {user && myProfile && (
              <Link to={`/${myProfile.username}`} className="landing-cta">
                Go to My Profile <FiArrowRight size={16} />
              </Link>
            )}
          </div>
          <div className="landing-demo">
            <img src={`${import.meta.env.BASE_URL}demo.png`} alt="Demo" className="landing-demo-placeholder" style={{ objectFit: 'cover' }} />
          </div>
        </div>

        {profiles.length > 0 && (
          <div className="landing-profiles-section">
            <h2 className="landing-section-title">Explore others' travel portfolios</h2>
            <div className="landing-profiles">
              {profiles.map((p) => (
                <Link key={p.id} to={`/${p.username}`} className="landing-profile-card">
                  <div className="landing-profile-avatar">
                    {p.profile_pic ? (
                      <img src={p.profile_pic} alt="" loading="lazy" />
                    ) : (
                      <FiUser size={28} />
                    )}
                  </div>
                  <div className="landing-profile-info">
                    <h3>{p.display_name || p.username}</h3>
                    <span className="landing-profile-username">@{p.username}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}

      {showSetup && (
        <div className="modal-overlay">
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create Your Profile</h2>
              <button className="icon-btn" onClick={() => setShowSetup(false)}><FiX /></button>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: 16 }}>
              Pick a username for your travel portfolio URL.
            </p>
            {setupError && <div className="login-error">{setupError}</div>}
            <form onSubmit={handleCreateProfile}>
              <div className="form-group">
                <label>Username *</label>
                <input
                  value={setupUsername}
                  onChange={(e) => setSetupUsername(e.target.value)}
                  placeholder="e.g. johndoe"
                  required
                  autoFocus
                />
                <span style={{ fontSize: '0.75rem', color: '#999', marginTop: 4, display: 'block' }}>
                  Your URL: /{setupUsername.toLowerCase().replace(/[^a-z0-9-]/g, '') || '...'}
                </span>
              </div>
              <div className="form-group" style={{ marginTop: 12 }}>
                <label>Display Name</label>
                <input
                  value={setupDisplay}
                  onChange={(e) => setSetupDisplay(e.target.value)}
                  placeholder="e.g. John Doe"
                />
              </div>
              <div className="form-actions" style={{ marginTop: 16 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowSetup(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={!setupUsername.trim()}>Create Profile</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
