
from datetime import datetime

def get_current_time() -> str:
    
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")

def format_currency(amount: float, currency: str = "USD") -> str:
    symbols = {"USD": "$", "EUR": "€", "GBP": "£", "JPY": "¥"}
    symbol = symbols.get(currency, currency)
    
    if currency == "JPY":
        return f"{symbol}{int(amount)}"
    return f"{symbol}{amount:.2f}"

def _log_activity(activity: str) -> None:
    print(f"[LOG] {datetime.now()}: {activity}")