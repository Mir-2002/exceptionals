"""String formatting utilities."""

def title_case(text: str) -> str:
    """Convert text to title case."""
    return text.title()

def snake_to_camel(snake_str: str) -> str:
    """Convert snake_case to camelCase."""
    components = snake_str.split('_')
    return components[0] + ''.join(x.title() for x in components[1:])

def _internal_formatter(text: str, format_type: str) -> str:
    """Internal formatter function (private)."""
    if format_type == "upper":
        return text.upper()
    elif format_type == "lower":
        return text.lower()
    return text