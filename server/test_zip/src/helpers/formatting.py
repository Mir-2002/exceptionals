

def title_case(text: str) -> str:
    
    return text.title()

def snake_to_camel(snake_str: str) -> str:
    
    components = snake_str.split('_')
    return components[0] + ''.join(x.title() for x in components[1:])

def _internal_formatter(text: str, format_type: str) -> str:
    
    if format_type == "upper":
        return text.upper()
    elif format_type == "lower":
        return text.lower()
    return text