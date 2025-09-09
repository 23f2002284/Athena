import os

def clean_log_file(log_path, filter_keyword):
    """Reads a log file, filters out lines containing a specific keyword,
    and writes the cleaned content back to the file.
    """
    if not os.path.exists(log_path):
        print(f"Error: Log file not found at {log_path}")
        return

    try:
        with open(log_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()

        # Filter out the unwanted lines
        cleaned_lines = [line for line in lines if filter_keyword not in line]

        with open(log_path, 'w', encoding='utf-8') as f:
            f.writelines(cleaned_lines)

        print(f"Successfully cleaned {log_path}. Removed {len(lines) - len(cleaned_lines)} lines.")

    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    log_file_to_clean = os.path.join('logs', 'fact_checker.log')
    keyword_to_filter = "Resource exhausted"
    
    clean_log_file(log_file_to_clean, keyword_to_filter)