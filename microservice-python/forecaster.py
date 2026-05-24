import sys
import json
import pandas as pd
import numpy as np
from prophet import Prophet
import logging
from datetime import datetime

# Désactivation des logs
logging.getLogger('prophet').setLevel(logging.ERROR)
logging.getLogger('cmdstanpy').setLevel(logging.ERROR)

def forecast(data, n_months=6):
    # Vérifier qu'il y a assez de données
    if not data or len(data) < 2:
        return {
            "predictions": [],
            "alert": False,
            "reason": "Pas assez de données historiques pour une prévision fiable (minimum 2 mois)."
        }
    
    try:
        # Convertir les données en DataFrame et préparer les colonnes pour Prophet
        df = pd.DataFrame(data)
        df['ds'] = pd.to_datetime(df['month'])
        
        # 1. Forecast pour Rentabilité (Marge)
        df_marge = df[['ds', 'rentabilite']].rename(columns={'rentabilite': 'y'})
        # On crée un modèle Prophet. On active la saisonnalité annuelle, mais pas hebdomadaire ou journalière, car nos données sont mensuelles. On ajuste aussi le seasonality_prior_scale pour éviter l'overfitting sur de petits datasets.
        m_marge = Prophet(
            yearly_seasonality=True, 
            weekly_seasonality=False, 
            daily_seasonality=False,
            seasonality_prior_scale=0.1 
        )
        m_marge.fit(df_marge)
        
        # Création des prévisions pour les prochains mois
        future_marge = m_marge.make_future_dataframe(periods=n_months, freq='MS')
        forecast_marge = m_marge.predict(future_marge)
        
        # 2. Forecast pour Coûts (CoutTotal)
        df_cout = df[['ds', 'coutTotal']].rename(columns={'coutTotal': 'y'})
        m_cout = Prophet(
            yearly_seasonality=True, 
            weekly_seasonality=False, 
            daily_seasonality=False,
            seasonality_prior_scale=0.1
        )
        m_cout.fit(df_cout)
        
        future_cout = m_cout.make_future_dataframe(periods=n_months, freq='MS')
        forecast_cout = m_cout.predict(future_cout)
        
        # Récupérer uniquement les prévisions pour les prochains mois
        pred_marge_df = forecast_marge.tail(n_months)
        pred_cout_df = forecast_cout.tail(n_months)

        # Calcul des moyennes historiques pour la détection de risques
        hist_avg_margin = df['rentabilite'].mean()
        hist_avg_cost = df['coutTotal'].mean()
        
        predictions = []
        alert = False
        reasons = []
        
        for (_, row_m), (_, row_c) in zip(pred_marge_df.iterrows(), pred_cout_df.iterrows()):
            pm = round(float(row_m['yhat']), 2)
            pc = round(float(row_c['yhat']), 2)
            pc = max(0, pc) # Cost shouldn't be negative
            
            month_str = row_m['ds'].strftime('%Y-%m')
            predictions.append({
                "month": month_str,
                "predicted_rentabilite": pm,
                "predicted_cout": pc
            })
            
            # --- Smart Risk Detection ---
            month_name = row_m['ds'].strftime('%B %Y')
            
            # Si la marge devient négative → alerte.
            if pm < 0:
                alert = True
                reasons.append(f"ALERTE : Marge négative prévue en {month_name} ({pm}€)")
            
            # Si la marge prévue est inférieure à 50% de la moyenne historique → alerte.
            elif pm < (hist_avg_margin * 0.5):
                alert = True
                reasons.append(f"RISQUE : Chute importante de rentabilité prévue en {month_name}")
                
            # les coûts augmentent de plus de 30% par rapport à la moyenne.
            if pc > (hist_avg_cost * 1.3):
                alert = True
                reasons.append(f"RISQUE : Augmentation anormale des coûts en {month_name} (+30%)")

        # Determine trend
        last_pred = predictions[-1]['predicted_rentabilite']
        first_pred = predictions[0]['predicted_rentabilite']
        trend = "up" if last_pred >= first_pred else "down"

        # --- Advanced Recommendations Engine ---
        strategic_recommendations = []
        
        # Aggregated values for analysis
        avg_pred_margin = sum([p['predicted_rentabilite'] for p in predictions]) / len(predictions)
        avg_pred_cost = sum([p['predicted_cout'] for p in predictions]) / len(predictions)
        max_predicted_revenue = max([(p['predicted_rentabilite'] + p['predicted_cout']) for p in predictions])
        hist_max_revenue = (df['rentabilite'] + df['coutTotal']).max()

        # 1. Recommendation: TJM Optimization (if margin drops)
        if avg_pred_margin < (hist_avg_margin * 0.95):
            strategic_recommendations.append({
                "type": "TJM",
                "title": "Optimisation des Tarifs (TJM)",
                "advice": "L'IA détecte un risque d'érosion de la marge nette. Une révision de vos tarifs (TJM) sur les nouveaux contrats permettrait de compenser la hausse des charges.",
                "priority": "High"
            })
            
        # 2. Recommendation: Hiring needs (if CA grows)
        if max_predicted_revenue > (hist_max_revenue * 1.05):
            peak_month_idx = np.argmax([(p['predicted_rentabilite'] + p['predicted_cout']) for p in predictions])
            peak_month_name = predictions[peak_month_idx]['month']
            strategic_recommendations.append({
                "type": "RECRUITMENT",
                "title": "Opportunité de Croissance",
                "advice": f"Le pic d'activité prévu pour {peak_month_name} approche de votre maximum historique. Un recrutement préventif sécuriserait vos délais de livraison.",
                "priority": "Medium"
            })

        # 3. Recommendation: Cost Control
        if avg_pred_cost > (hist_avg_cost * 1.15):
            strategic_recommendations.append({
                "type": "COSTS",
                "title": "Surveillance des Coûts",
                "advice": "Une tendance à l'alourdissement des charges est identifiée. Une revue des frais fixes pourrait améliorer votre Rentabilité de 3 à 5 points.",
                "priority": "High"
            })

        # 4. Recommendation: Stable/Healthy Performance
        if not strategic_recommendations:
            strategic_recommendations.append({
                "type": "STRATEGY",
                "title": "Performance Stable",
                "advice": "Votre trajectoire financière est saine. C'est le moment idéal pour investir dans la R&D ou la formation pour pérenniser cette stabilité.",
                "priority": "Low"
            })

        return {
            "predictions": predictions,
            "alert": alert,
            "reasons": list(set(reasons)),
            "strategic_recommendations": strategic_recommendations,
            "trend": trend,
            "algorithm": "Prophet",
            "historical_averages": {
                "margin": round(float(hist_avg_margin), 2),
                "cost": round(float(hist_avg_cost), 2)
            }
        }

    except Exception as e:
        return {
            "error": str(e),
            "alert": True,
            "reason": f"Erreur lors de l'exécution de Prophet : {str(e)}"
        }

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No data provided. Usage: python forecaster.py <json_string|file_path> [n_months]"}))
        sys.exit(1)
        
    try:
        input_raw = sys.argv[1]
        
        # Support reading from file if it exists, otherwise treat as JSON string
        import os
        if os.path.isfile(input_raw):
            with open(input_raw, 'r', encoding='utf-8') as f:
                input_data = json.load(f)
        else:
            # If it's '-' read from stdin
            if input_raw == '-':
                input_data = json.loads(sys.stdin.read())
            else:
                input_data = json.loads(input_raw)

        n_months = int(sys.argv[2]) if len(sys.argv) > 2 else 6
        result = forecast(input_data, n_months)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)
