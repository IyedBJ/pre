import React from 'react';
import { Link } from 'react-router-dom';
import FuzzyText from '../components/Shared/FuzzyText';

const NotFound = () => {
  return (
    <div className="h-screen bg-[#E8F8DF] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      
      
      <div className='w-64 h-64 bg-[#7ED957]/20 rounded-full absolute -top-32 -left-32 animate-pulse'></div>
      <div className='w-96 h-96 bg-[#7ED957]/30 rounded-full absolute top-[-10%] right-[-10%] blur-3xl'></div>
      <div className='w-64 h-64 bg-[#7ED957]/20 rounded-full absolute bottom-[-10%] left-[-5%] blur-2xl'></div>

      <div className="relative z-10 text-center flex flex-col items-center">
        <FuzzyText 
          baseIntensity={0.43}
          hoverIntensity={0.5}
          enableHover={true}
          color="#7ED957"
          fontSize="clamp(5rem, 20vw, 15rem)"
          fontWeight={900}
        >
          404
        </FuzzyText>

        <h2 className="text-3xl font-bold text-slate-800 mt-8 mb-4">
          Oups ! Page introuvable
        </h2>
        
        <p className="text-slate-600 mb-10 max-w-md mx-auto text-lg">
          La page que vous recherchez semble avoir disparu dans le brouillard. 
          Vérifiez l'URL ou retournez à l'accueil.
        </p>

        <Link 
          to="/" 
          className="px-8 py-3 bg-[#7ED957] text-white font-semibold rounded-lg hover:bg-[#6CC94A] transition-all transform hover:scale-105 shadow-lg uppercase tracking-wide"
        >
          Retour à l'accueil
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
