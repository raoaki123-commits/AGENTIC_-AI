import tiktoken

class TokenizerService:
    def __init__(self):
        # Using the standard GPT-4 tokenizer (cl100k_base)
        try:
            self.encoding = tiktoken.get_encoding("cl100k_base")
        except Exception:
            self.encoding = tiktoken.get_encoding("gpt2")  # Fallback

    def tokenize_details(self, text: str):
        """
        Tokenizes text and returns a list of dictionaries with token details,
        including token ID, decoded text, and string character spans.
        """
        if not text:
            return []
            
        token_ids = self.encoding.encode(text)
        tokens_details = []
        
        # To determine character spans, we map tokens back to character index ranges
        current_char_index = 0
        
        for token_id in token_ids:
            # Decode the token ID back to bytes, then string
            token_bytes = self.encoding.decode_single_token_bytes(token_id)
            # Decode with replacement character if it's a partial UTF-8 sequence
            token_str = token_bytes.decode("utf-8", errors="replace")
            
            # Find the match position in the original text (accounting for potential multi-byte characters)
            start_pos = current_char_index
            length = len(token_str)
            end_pos = start_pos + length
            current_char_index = end_pos
            
            tokens_details.append({
                "id": token_id,
                "text": token_str,
                "start": start_pos,
                "end": end_pos
            })
            
        return tokens_details

    def get_token_count(self, text: str) -> int:
        return len(self.encoding.encode(text))

tokenizer_service = TokenizerService()
