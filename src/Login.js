// src/Login.js
import React, { useState } from 'react';
import { db, storage} from './firebaseConfig';
import './styles.css'; // Assicurati che il percorso sia corretto
import logoPieno from './logo-pieno.svg'; // Assicurati che il percorso sia corretto
import { useNavigate } from 'react-router-dom';

import { collection, getDocs } from "firebase/firestore";

function Login() {
  const navigate = useNavigate(); // Call useNavigate here at the top level
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const [userFocused, setUserFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const handleUserFocus = () => setUserFocused(true);
  const handleUserBlur = () => setUserFocused(false);
  const handlePasswordFocus = () => setPasswordFocused(true);
  const handlePasswordBlur = () => setPasswordFocused(false);

  const loginUser = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "admin"));
      let isAuthenticated = false;
      querySnapshot.forEach((doc) => {
        const userData = doc.data();
        if (userData.user === user && userData.password === password) {
          isAuthenticated = true;
          console.log("Admin autenticato con successo:", userData.user);
        }
      });
      if (isAuthenticated) {
        navigate('/HomePage', { state: { user: user } }); // Use navigate to redirect
      } else {
        throw new Error("Credenziali non valide");
        setMessage("Credenziali non valide");
      }
    } catch (error) {
      console.error("Errore:", error);
      setMessage("Errore di autenticazione: " + error.message);
    }
  };

  return (
    <div className="e2_163">
      <div className="e2_164">
        <div className="e2_165"></div>
        <div className="e2_166">
          <div className="e2_167">
            <div className="e2_168"></div>
            <div className="e2_169"></div>
            <div className="e2_170"><img src={logoPieno} alt="Logo Parthenope" /></div>
          </div>
        </div>
        <span className="e2_172">Bentornato!</span>
        <span className="e2_173">Accedi al tuo profilo personale</span>
        <div className="e2_174">
          <div className="e2_175">
            <div className="ei2_175_41_287">
              <input type="email" className="input-field" id="user" value={user} onChange={(e) => setUser(e.target.value)} onFocus={handleUserFocus} onBlur={handleUserBlur} placeholder="user" />
              <div className="ei2_175_41_288"></div>
            </div>
            <div className={`ei628_198_41_290 ${userFocused ? 'highlight-color' : ''}`}></div>
          </div>
          <div className="e628_198">
  <div className="ei628_198_41_287">
    <div className="ei628_198_41_288">
      <input type="password" className="input-field" id="password" value={password} onChange={(e) => setPassword(e.target.value)} onFocus={handlePasswordFocus} onBlur={handlePasswordBlur} placeholder="password" />
    </div>
  </div>
  <div className={`ei628_198_41_290 ${passwordFocused ? 'highlight-color' : ''}`}></div>
</div>
{message && <div style={{ color: 'red', marginTop: '10px' }}>{message && <div className="error-message">{message}</div>}</div>} 
          <div className="ei628_198_41_290"></div>
          <div className="e628_203" onClick={loginUser}><span className="e628_204">Accedi</span></div>
          <div className="e2_178"></div>
        </div>
      </div>
    </div>
  );
}

export default Login;
