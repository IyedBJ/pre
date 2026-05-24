import React, { useState } from 'react'; 
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from "../assets/logo-elzei.jpg";
import TextType from '../components/Shared/TextType';
import toast, { Toaster } from 'react-hot-toast';
import Slideshow from '../components/Login/Slideshow';
import loginBg from '../assets/login-bg.jpg';


/**
 * Composant de la page de connexion
 * Affiche un formulaire d'authentification avec un diaporama côté gauche (sur desktop)
 * Gère la validation, l'appel API via le contexte d'auth, et la redirection selon le rôle
 */

const Login = () => {
  const navigate = useNavigate();
  // Récupère la fonction login depuis le contexte d'authentification
  const { login } = useAuth();
   // --- États locaux du formulaire ---
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");  //: boîte vide au départ.
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  // Validation simple : les deux champs doivent être non vides (trim)
  const isFormValid = username.trim() !== "" && password.trim() !== "";

  const slideshowImages = [
    loginBg,
    "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2426&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=2340&auto=format&fit=crop"
  ];

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Appel de la fonction login du contexte (requête API + stockage token)
      const user = await login(username, password);
      toast.success("Connexion réussie !");

      setTimeout(() => {
        // Redirection vers /home pour tous les rôles car c'est la page principale avec Sidebar + Dashboard
        navigate("/home");
      }, 1500);

    } catch (err) {
      // En cas d'erreur (identifiants invalides, réseau, etc.)
      console.error(err);
      // Récupère le message d'erreur renvoyé par le backend, ou un message générique
      const errorMsg = err.response?.data?.message || "Erreur de connexion";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='h-screen bg-[#E8F8DF] overflow-hidden relative'>
      <Toaster position="top-right" reverseOrder={false} />

      <div className='w-64 h-64 bg-[#7ED957]/20 rounded-full absolute -top-32 -left-32 animate-pulse'></div>
      <div className='w-96 h-96 bg-[#7ED957]/30 rounded-full absolute top-[-10%] right-[-10%] blur-3xl'></div>
      <div className='w-64 h-64 bg-[#7ED957]/20 rounded-full absolute bottom-[-10%] left-[-5%] blur-2xl'></div>

      <div className='container h-screen flex items-center justify-center px-10 mx-auto relative z-10'>
        <div className='w-full max-w-[1100px] h-[85vh] flex bg-white rounded-2xl shadow-2xl overflow-hidden'>

          {/* LEFT SIDE */}
          <div className='hidden md:flex w-1/2 relative p-12 flex-col justify-end overflow-hidden'>
            <Slideshow images={slideshowImages} interval={10000} />
            <div className='absolute inset-0 bg-black/20 z-0'></div>

            <div className='relative z-10'>
              <h4 className='text-5xl text-white font-bold leading-[64px]'>
                <TextType 
                  text={"Finance \nOptimisée"} 
                  typingSpeed={75}
                  loop={false}
                  showCursor={true}
                  cursorCharacter="_"
                  cursorBlinkDuration={0.5}
                />
              </h4>

              <p className='text-white/90 mt-6 leading-relaxed text-lg max-w-[90%] min-h-[4em]'>
                <TextType 
                  text="Analyse des performances, coûts et projets avec dashboards interactifs et prévisions." 
                  typingSpeed={50}
                  initialDelay={2000}
                  loop={false}
                  showCursor={true}
                  cursorCharacter="_"
                  cursorBlinkDuration={0.5}
                />
              </p>
            </div>
          </div>

          {/* RIGHT SIDE LOGIN */}
          <div className='w-full md:w-1/2 p-12 md:p-24 flex flex-col justify-center'>
            <div className="flex items-center gap-3 mb-8">
              <img 
                src={logo} 
                alt="Elzei Logo"
                className="w-35 h-35 object-contain"
              />
            </div>

            <form onSubmit={handleLogin} className='w-full'>
              <h4 className='text-3xl font-bold text-slate-800 mb-10'>Connexion</h4>

              {/* USERNAME */}
              <div className='flex flex-col gap-2'>
                <label className='text-xs text-slate-400 font-medium uppercase tracking-wider ml-1'>
                  Nom d'utilisateur
                </label>
                <input 
                  type='text' 
                  placeholder='Identifiant AD' 
                  className='input-box border-slate-100 bg-slate-50/50 focus:border-[#7ED957]' 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>

              {/* PASSWORD */}
              <div className='flex flex-col gap-2 relative mt-4'>
                <label className='text-xs text-slate-400 font-medium uppercase tracking-wider ml-1'>
                  Mot de passe
                </label>

                <div className='relative'>
                  <input 
                    type={showPassword ? 'text' : 'password'}
                    placeholder='Mot de passe' 
                    className='input-box border-slate-100 bg-slate-50/50 pr-12 mb-0 focus:border-[#7ED957]' 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />

                  <button 
                    type='button' 
                    onClick={() => setShowPassword(!showPassword)}
                    className='absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#7ED957]'
                  >
                    👁
                  </button>
                </div>
              </div>

              {/* BUTTON */}
              <div className='mt-8'>
                <button 
                  type='submit' 
                  disabled={loading || !isFormValid}
                  className='w-full text-sm font-semibold text-white bg-[#7ED957] p-4 rounded-lg my-1 
                  hover:bg-[#6CC94A] transition-all uppercase tracking-wide shadow-md
                  disabled:bg-gray-400 disabled:cursor-not-allowed disabled:opacity-60'
                >
                  {loading ? "CONNEXION..." : "SE CONNECTER"}
                </button>
              </div>

            </form>
          </div>

        </div>
      </div>
    </div>
  )
}

export default Login;
