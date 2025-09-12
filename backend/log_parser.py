import re
import json
import logging
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime
from models import MessageType, ClaimData, SourceBlock, ProgressUpdate, LogEntry

class LogParser:
    """Enhanced log parser for extracting structured data from main_test.log"""
    
    def __init__(self):
        self.progress_patterns = [
            r'step\s+(\d+)(?:\s+of\s+(\d+))?',
            r'progress[:\s]+(\d+)%',
            r'processing[:\s]+(\d+)/(\d+)',
            r'iteration[:\s]+(\d+)',
            r'stage[:\s]+(\w+)',
        ]
        
        self.claim_patterns = [
            r'claim[s]?[:\s]+(.+?)(?:\n|$)',
            r'statement[s]?[:\s]+(.+?)(?:\n|$)',
            r'assertion[s]?[:\s]+(.+?)(?:\n|$)',
            r'split.*claim[s]?[:\s]+(.+?)(?:\n|$)',
            r'disambiguat.*claim[s]?[:\s]+(.+?)(?:\n|$)',
        ]
        
        self.result_patterns = [
            r'(refuted|true|false|verified|unverified)',
            r'verdict[:\s]+(.*?)(?:\n|$)',
            r'result[:\s]+(.*?)(?:\n|$)',
            r'conclusion[:\s]+(.*?)(?:\n|$)',
        ]
        
        self.educational_patterns = [
            r'educational[:\s]+(.+?)(?:\n|$)',
            r'explanation[:\s]+(.+?)(?:\n|$)',
            r'context[:\s]+(.+?)(?:\n|$)',
            r'background[:\s]+(.+?)(?:\n|$)',
        ]
        
        self.url_pattern = r'https?://[^\s<>"{}|\\^`\[\]]+'
        
    def parse_log_line(self, log_line: str) -> Optional[LogEntry]:
        """Parse a single log line into structured data"""
        try:
            # Extract basic log components
            pattern = r'(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2},\d{3}) - ([^-]+) - (\w+) - (.+)'
            match = re.match(pattern, log_line)
            
            if not match:
                return None
                
            timestamp, logger_name, level, message = match.groups()
            
            # Determine message type and extract specific data
            msg_type, parsed_data = self._classify_and_parse_message(message)
            
            return LogEntry(
                timestamp=timestamp,
                logger=logger_name.strip(),
                level=level,
                message=message.strip(),
                type=msg_type,
                parsed_data=parsed_data
            )
            
        except Exception as e:
            logging.error(f"Error parsing log line: {e}")
            return None
    
    def _classify_and_parse_message(self, message: str) -> Tuple[MessageType, Dict[str, Any]]:
        """Classify message type and extract relevant data"""
        message_lower = message.lower()
        parsed_data = {}
        
        # Check for progress indicators
        if self._is_progress_message(message_lower):
            progress_data = self._extract_progress_data(message)
            return MessageType.PROGRESS, progress_data
            
        # Check for claims
        elif self._is_claim_message(message_lower):
            claims_data = self._extract_claims_data(message)
            return MessageType.CLAIM, claims_data
            
        # Check for results
        elif self._is_result_message(message_lower):
            result_data = self._extract_result_data(message)
            return MessageType.RESULT, result_data
            
        # Check for educational content
        elif self._is_educational_message(message_lower):
            educational_data = self._extract_educational_data(message)
            return MessageType.EDUCATIONAL, educational_data
            
        # Check for sources/URLs
        elif self._is_sources_message(message):
            sources_data = self._extract_sources_data(message)
            return MessageType.SOURCES, sources_data
            
        # Default to info
        else:
            return MessageType.INFO, {"raw_message": message}
    
    def _is_progress_message(self, message: str) -> bool:
        """Check if message contains progress information"""
        keywords = ['progress', 'step', 'stage', 'iteration', 'processing', 'starting', 'completing']
        return any(keyword in message for keyword in keywords)
    
    def _is_claim_message(self, message: str) -> bool:
        """Check if message contains claim information"""
        keywords = ['claim', 'statement', 'assertion', 'split', 'disambiguat', 'selection']
        return any(keyword in message for keyword in keywords)
    
    def _is_result_message(self, message: str) -> bool:
        """Check if message contains result information"""
        keywords = ['refuted', 'true', 'false', 'verified', 'verdict', 'result', 'conclusion', 'final']
        return any(keyword in message for keyword in keywords)
    
    def _is_educational_message(self, message: str) -> bool:
        """Check if message contains educational content"""
        keywords = ['educational', 'explanation', 'context', 'background', 'learn', 'understand']
        return any(keyword in message for keyword in keywords)
    
    def _is_sources_message(self, message: str) -> bool:
        """Check if message contains source URLs"""
        return bool(re.search(self.url_pattern, message))
    
    def _extract_progress_data(self, message: str) -> Dict[str, Any]:
        """Extract progress information from message"""
        data = {"raw_message": message}
        
        for pattern in self.progress_patterns:
            match = re.search(pattern, message, re.IGNORECASE)
            if match:
                groups = match.groups()
                if len(groups) >= 2 and groups[1]:  # Has total count
                    current, total = int(groups[0]), int(groups[1])
                    data.update({
                        "current_step": current,
                        "total_steps": total,
                        "progress_percentage": (current / total) * 100
                    })
                elif len(groups) >= 1:  # Has single number
                    if '%' in pattern:
                        data["progress_percentage"] = int(groups[0])
                    else:
                        data["current_step"] = int(groups[0])
                break
        
        # Extract stage/phase information
        stage_match = re.search(r'(starting|processing|completing|finished)\s+(.+?)(?:\n|$)', message, re.IGNORECASE)
        if stage_match:
            data["stage"] = stage_match.group(1).lower()
            data["stage_description"] = stage_match.group(2).strip()
            
        return data
    
    def _extract_claims_data(self, message: str) -> Dict[str, Any]:
        """Extract claims information from message"""
        data = {"raw_message": message, "claims": []}
        
        for pattern in self.claim_patterns:
            matches = re.findall(pattern, message, re.IGNORECASE | re.MULTILINE)
            for match in matches:
                claim_text = match.strip()
                if claim_text and len(claim_text) > 10:  # Filter out very short matches
                    claim_data = ClaimData(
                        claim_text=claim_text,
                        status="processing"
                    )
                    data["claims"].append(claim_data.dict())
        
        # Extract processing stage
        if 'split' in message.lower():
            data["processing_stage"] = "splitting"
        elif 'disambiguat' in message.lower():
            data["processing_stage"] = "disambiguation"
        elif 'selection' in message.lower():
            data["processing_stage"] = "selection"
        else:
            data["processing_stage"] = "processing"
            
        return data
    
    def _extract_result_data(self, message: str) -> Dict[str, Any]:
        """Extract result information from message"""
        data = {"raw_message": message}
        
        # Extract verdict
        for pattern in self.result_patterns:
            match = re.search(pattern, message, re.IGNORECASE)
            if match:
                verdict = match.group(1).strip().upper()
                data["verdict"] = verdict
                break
        
        # Extract confidence if present
        confidence_match = re.search(r'confidence[:\s]+(\d+(?:\.\d+)?)%?', message, re.IGNORECASE)
        if confidence_match:
            data["confidence"] = float(confidence_match.group(1))
            
        # Extract reasoning
        reasoning_match = re.search(r'(?:because|reason|explanation)[:\s]+(.+?)(?:\n|$)', message, re.IGNORECASE)
        if reasoning_match:
            data["reasoning"] = reasoning_match.group(1).strip()
            
        return data
    
    def _extract_educational_data(self, message: str) -> Dict[str, Any]:
        """Extract educational content from message"""
        data = {"raw_message": message}
        
        for pattern in self.educational_patterns:
            match = re.search(pattern, message, re.IGNORECASE)
            if match:
                content = match.group(1).strip()
                data["educational_content"] = content
                break
        
        # Extract tips or key points
        tips_matches = re.findall(r'(?:tip|key point|important)[:\s]+(.+?)(?:\n|$)', message, re.IGNORECASE)
        if tips_matches:
            data["tips"] = [tip.strip() for tip in tips_matches]
            
        return data
    
    def _extract_sources_data(self, message: str) -> Dict[str, Any]:
        """Extract source URLs and related information"""
        data = {"raw_message": message, "sources": []}
        
        urls = re.findall(self.url_pattern, message)
        for url in urls:
            source = SourceBlock(
                url=url,
                title=self._extract_title_near_url(message, url),
                source_type=self._classify_source_type(url)
            )
            data["sources"].append(source.dict())
            
        return data
    
    def _extract_title_near_url(self, message: str, url: str) -> str:
        """Try to extract title or description near the URL"""
        # Look for text before the URL that might be a title
        url_pos = message.find(url)
        if url_pos > 0:
            preceding_text = message[:url_pos].strip()
            # Get last sentence or phrase before URL
            sentences = re.split(r'[.!?]', preceding_text)
            if sentences:
                return sentences[-1].strip()[:100]  # Limit length
        return "Source"
    
    def _classify_source_type(self, url: str) -> str:
        """Classify source type based on URL"""
        if any(domain in url.lower() for domain in ['wikipedia.org', 'britannica.com']):
            return "encyclopedia"
        elif any(domain in url.lower() for domain in ['reuters.com', 'bbc.com', 'cnn.com', 'news']):
            return "news"
        elif any(domain in url.lower() for domain in ['gov', '.edu', 'scholar.google']):
            return "official"
        else:
            return "web"
    
    def parse_log_file(self, file_path: str, last_n_lines: int = 100) -> List[LogEntry]:
        """Parse the last N lines of a log file"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                lines = f.readlines()
                
            # Get last N lines
            recent_lines = lines[-last_n_lines:] if len(lines) > last_n_lines else lines
            
            parsed_entries = []
            for line in recent_lines:
                if line.strip():
                    entry = self.parse_log_line(line.strip())
                    if entry:
                        parsed_entries.append(entry)
                        
            return parsed_entries
            
        except Exception as e:
            logging.error(f"Error parsing log file: {e}")
            return []
    
    def extract_progress_summary(self, entries: List[LogEntry]) -> Dict[str, Any]:
        """Extract overall progress summary from log entries"""
        summary = {
            "total_claims": 0,
            "processed_claims": 0,
            "current_stage": "unknown",
            "progress_percentage": 0.0,
            "latest_verdict": None,
            "sources_found": 0
        }
        
        for entry in entries:
            if entry.type == MessageType.PROGRESS and entry.parsed_data:
                if "progress_percentage" in entry.parsed_data:
                    summary["progress_percentage"] = entry.parsed_data["progress_percentage"]
                if "stage_description" in entry.parsed_data:
                    summary["current_stage"] = entry.parsed_data["stage_description"]
                    
            elif entry.type == MessageType.CLAIM and entry.parsed_data:
                claims = entry.parsed_data.get("claims", [])
                summary["total_claims"] += len(claims)
                
            elif entry.type == MessageType.RESULT and entry.parsed_data:
                if "verdict" in entry.parsed_data:
                    summary["latest_verdict"] = entry.parsed_data["verdict"]
                    
            elif entry.type == MessageType.SOURCES and entry.parsed_data:
                sources = entry.parsed_data.get("sources", [])
                summary["sources_found"] += len(sources)
                
        return summary
