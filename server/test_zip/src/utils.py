"""Utility functions for the application."""
from datetime import datetime

def get_current_time() -> str:
    """Get the current time formatted as a string."""
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")

def format_currency(amount: float, currency: str = "USD") -> str:
    """
    Format a currency amount.
    
    Args:
        amount: The amount to format
        currency: The currency code
        
    Returns:
        Formatted currency string
    """
    symbols = {"USD": "$", "EUR": "€", "GBP": "£", "JPY": "¥"}
    symbol = symbols.get(currency, currency)
    
    if currency == "JPY":
        return f"{symbol}{int(amount)}"
    return f"{symbol}{amount:.2f}"

def _log_activity(activity: str) -> None:
    """Log an activity (private function)."""
    print(f"[LOG] {datetime.now()}: {activity}")