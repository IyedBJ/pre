import { useState, useEffect, useRef } from "react";
import { Search, ChevronDown, Check } from "lucide-react";

 // options - Array of { id, name } objects.
 // value - Currently selected ID.
 // onChange - Callback triggered when an option is selected.
 // placeholder - Input placeholder.
 // label - Input label.
 // error - Error message to display.
 // disabled - Whether the input is disabled.
 // className - Additional classes for the container.
 // showAllOnFocus - Whether to show all options when focusing (default: true).

export default function Autocomplete({ 
  options = [], 
  value, 
  onChange, 
  placeholder = "Sélectionner...", 
  label, 
  error, 
  disabled = false,
  className = "",
  showAllOnFocus = true
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  // Synchronisation entre value et searchTerm : quand value change, on met à jour searchTerm pour afficher le nom de l'option sélectionnée. Si value est vide, on réinitialise searchTerm.
  useEffect(() => {
    const selected = options.find(opt => String(opt.id) === String(value));
    if (selected) {
      
      setSearchTerm(selected.name);
    } else if (!value) {
      setSearchTerm("");
    }
  }, [value, options]);
  // Fermeture du menu lorsque l'utilisateur clique en dehors
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        const selected = options.find(opt => String(opt.id) === String(value));
        setSearchTerm(selected ? selected.name : "");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [value, options]);
  // filtrage des options en fonction du terme de recherche
  const filteredOptions = options.filter((opt) =>
    opt.name?.toString().toLowerCase().includes(searchTerm.toLowerCase())
  );
  // option selectionnée, mise à jour du champ de recherche et fermeture du menu
  const handleSelect = (option) => {
    onChange(option.id);
    setSearchTerm(option.name);
    setIsOpen(false);
  };
  // Affiche toutes les options au focus si showAllOnFocus est vrai, sinon garde le comportement de filtrage normal
  const handleFocus = () => {
    if (showAllOnFocus) {
      setSearchTerm(""); 
    }
    setIsOpen(true);
  };

  return (
    <div className={`flex flex-col gap-1.5 relative ${className}`} ref={dropdownRef}>
      {label && <label className="text-slate-700 dark:text-gray-300 text-sm font-semibold">{label}</label>}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
          }}
          onFocus={handleFocus}
          placeholder={placeholder}
          className={`w-full h-12 rounded-lg border pl-10 pr-10 bg-white dark:bg-gray-900 text-slate-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#7fd959] transition-all cursor-pointer ${
            error ? "border-red-400" : "border-slate-200 dark:border-gray-700"
          } ${disabled ? "opacity-50 cursor-not-allowed bg-slate-50 dark:bg-gray-950" : ""}`}
          disabled={disabled}
        />
        <ChevronDown 
          className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 transition-transform cursor-pointer ${isOpen ? 'rotate-180' : ''}`} 
          onClick={() => !disabled && setIsOpen(!isOpen)}
        />
      </div>

      {isOpen && !disabled && (
        <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg shadow-xl z-[100] max-h-60 overflow-y-auto animate-fadeIn">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt) => (
              <div
                key={opt.id}
                onClick={() => handleSelect(opt)}
                className={`px-4 py-3 text-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-between ${
                  String(value) === String(opt.id) ? "bg-[#7fd959]/10 text-slate-900 dark:text-[#7fd959] font-semibold" : "text-slate-700 dark:text-gray-300"
                }`}
              >
                <span>{opt.name}</span>
                {String(value) === String(opt.id) && <Check className="w-4 h-4 text-[#7fd959]" />}
              </div>
            ))
          ) : (
            <div className="px-4 py-3 text-sm text-slate-400 text-center italic">
              Aucun résultat trouvé
            </div>
          )}
        </div>
      )}
      {error && <p className="text-red-400 text-xs">{error}</p>}
    </div>
  );
}


// composant React implémente une liste déroulante avec recherche et autocomplétion, permettant à l’utilisateur de sélectionner une option parmi une liste filtrée en temps réel. Il gère l’ouverture/fermeture du menu, la sélection d’options, et les clics en dehors pour fermer le menu.