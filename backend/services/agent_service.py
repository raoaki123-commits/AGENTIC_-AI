import json
from typing import Dict, Any, List
from backend.services.rag_service import rag_service
from backend.services.llm_service import llm_service

class AgentService:
    def run_study_workflow(self, mode: str, task: str) -> Dict[str, Any]:
        """
        Orchestrates multi-step agent flows based on user task and selected agent mode.
        Returns a dictionary containing:
        - steps: a list of sub-actions taken by the agent (for the dashboard logs)
        - output: the final generated study aid
        - sources: retrieved chunks used
        """
        mode = mode.lower()
        steps = []
        sources = []
        
        # 1. Check if we have context in our local vector database
        stats = rag_service.get_stats()
        has_notes = stats["total_chunks"] > 0
        
        # STEP 1: Understand task & planning
        steps.append({
            "title": "Parsing Intent & Context Lookup",
            "status": "completed",
            "message": f"Analyzing study task: '{task}'. Searching local document vector index. Found {stats['total_chunks']} indexed chunks."
        })
        
        # Retrieve chunks if we have documents indexed
        retrieved_context = ""
        if has_notes:
            steps.append({
                "title": "Retrieving Syllabus Information",
                "status": "completed",
                "message": f"Searching semantic database for queries relevant to: '{task}'."
            })
            # Retrieve relevant chunks
            retrieved_chunks = rag_service.retrieve_chunks(task, top_n=5)
            sources = retrieved_chunks
            
            # Format retrieved text
            retrieved_context = "\n\n".join([
                f"[Source: {c['metadata']['source']}, Page {c['metadata']['page']} (Relevance: {c['score']:.2f})]\n{c['text']}"
                for c in retrieved_chunks
            ])
            steps.append({
                "title": "Filtering & Context Assembly",
                "status": "completed",
                "message": f"Retrieved {len(retrieved_chunks)} relevant note sections. Assembled {len(retrieved_context)} characters of context."
            })
        else:
            steps.append({
                "title": "Context Lookup (Warning)",
                "status": "warning",
                "message": "No lecture notes uploaded. Running agent using LLM general academic knowledge base. (Note: Upload PDFs in Notes Tutor for customized grounding)."
            })
            retrieved_context = "No specific note context available. Rely on standard Generative AI, LLM Internals, and Agentic workflows curriculum."

        # Execute selected workflows
        if mode == "teach_topic" or mode == "teach":
            return self._run_teach_topic(task, retrieved_context, steps, sources)
            
        elif mode == "revision_plan" or mode == "revision":
            return self._run_revision_plan(task, retrieved_context, steps, sources)
            
        elif mode == "project_idea" or mode == "project":
            return self._run_project_generator(task, retrieved_context, steps, sources)
            
        elif mode == "quiz_generator" or mode == "quiz":
            return self._run_quiz_generator(task, retrieved_context, steps, sources)
            
        elif mode == "presentation_helper" or mode == "presentation":
            return self._run_presentation_helper(task, retrieved_context, steps, sources)
            
        else:
            # Fallback workflow: Smart Q&A orchestrator
            return self._run_generic_orchestrator(task, retrieved_context, steps, sources)

    def _run_teach_topic(self, task: str, context: str, steps: list, sources: list) -> Dict[str, Any]:
        steps.append({
            "title": "Synthesizing Curriculum Map",
            "status": "completed",
            "message": "Structuring educational breakdown into three sequential levels: Foundations (Beginner), Practical Architecture (Intermediate), and Advanced/Research Concepts."
        })
        
        prompt = f"""
        You are an expert GenAI Professor and Tutor. Your task is to teach the following topic: "{task}".
        
        Using the provided notes context (if available), break down the topic step-by-step.
        
        Format your response beautifully with Markdown, using the following structure:
        # GenAI Tutorial: [Topic Name]
        
        ## 1. Quick Concept Analogies
        Explain this concept using a simple real-world analogy (e.g. comparing attention to highlighting text in a book, or temperature to cooking spices).
        
        ## 2. Foundations (Beginner Level)
        Core definition, why it matters, and basic terminology.
        
        ## 3. Practical Architecture (Intermediate Level)
        Provide detailed explanation of how it is implemented, including any mathematical formulas or pseudo-code if applicable.
        
        ## 4. Advanced Frontiers & Pitfalls (Advanced Level)
        Deep-dive into edge cases, optimization problems, trade-offs, and modern research alternatives.
        
        ---
        Grounded Notes Context:
        {context}
        """
        
        steps.append({
            "title": "Invoking Generative Expert",
            "status": "completed",
            "message": "Generating structured Markdown tutorial output."
        })
        
        output = llm_service.generate_text(prompt, system_prompt="You are a premium GenAI tutor. Avoid dry lectures. Use analogies, clear formulas, and bullet points.")
        
        return {
            "steps": steps,
            "output": output,
            "sources": sources
        }

    def _run_revision_plan(self, task: str, context: str, steps: list, sources: list) -> Dict[str, Any]:
        steps.append({
            "title": "Extracting Concept Dependency Trees",
            "status": "completed",
            "message": "Identifying core topics, estimated learning difficulty, and sequential prerequisites."
        })
        
        prompt = f"""
        You are a highly structured Study Coach. Create an interactive revision plan for: "{task}".
        
        Based on the provided notes context (if available), compile a detailed, chronologically logical study guide.
        
        Format your response in clean Markdown:
        # Study Revision Plan: [Goal Name]
        
        ## 🗺️ Learning Roadmap Overview
        List the prerequisites and chronological flow of topics.
        
        ## 📅 Day-by-Day Schedule
        Provide a structured schedule. For each day, include:
        - **Core Focus**: specific subtopic
        - **Session Length**: e.g., 45 minutes
        - **Active Recall Exercise**: A prompt or question the student should answer from memory.
        - **Technical Drill**: e.g., writing code, solving equations, or analyzing a diagram.
        
        ## 🛠️ Recommended Learning Techniques
        Specific suggestions (Feynman technique, spaced repetition cards, etc.) tailored to this topic.
        
        ---
        Grounded Notes Context:
        {context}
        """
        
        steps.append({
            "title": "Scheduling Generation",
            "status": "completed",
            "message": "Compiling revision schedule calendar and active recall exercises."
        })
        
        output = llm_service.generate_text(prompt, system_prompt="You are an organized study mentor. Focus on active learning techniques.")
        
        return {
            "steps": steps,
            "output": output,
            "sources": sources
        }

    def _run_project_generator(self, task: str, context: str, steps: list, sources: list) -> Dict[str, Any]:
        steps.append({
            "title": "Scoping Practical Application",
            "status": "completed",
            "message": "Translating academic notes into a runnable project. Sizing for a 48-hour student hackathon scale."
        })
        
        prompt = f"""
        You are a GenAI Project Mentor. Create a hands-on learning project proposal based on: "{task}".
        
        Using the provided notes context (if available), create a step-by-step programming project guide.
        
        Format in Markdown:
        # Mini Project Guide: [Project Title]
        
        ## 🎯 Project Objective
        What does this project build, and what key GenAI concepts does it demonstrate?
        
        ## 💻 Recommended Tech Stack
        What libraries, APIs, or tools should they use (e.g. Python, Streamlit, Gemini API, numpy)?
        
        ## 🗺️ Implementation Steps (Milestones)
        Break the project into 4 clear milestones. Provide a brief description of what is built in each.
        
        ## 🚀 Challenge Extension Features
        Two advanced bonus features for students aiming for an A+ grade.
        
        ---
        Grounded Notes Context:
        {context}
        """
        
        steps.append({
            "title": "Drafting Architecture Specs",
            "status": "completed",
            "message": "Generating code layout structure and project specifications."
        })
        
        output = llm_service.generate_text(prompt, system_prompt="You are a software engineer mentor. Focus on clean code project scopes.")
        
        return {
            "steps": steps,
            "output": output,
            "sources": sources
        }

    def _run_quiz_generator(self, task: str, context: str, steps: list, sources: list) -> Dict[str, Any]:
        steps.append({
            "title": "Compiling Syllabus Core Points",
            "status": "completed",
            "message": "Scanning document context to extract testing items, definitions, and logical check-points."
        })
        
        prompt = f"""
        You are an Exam Creator. Create a self-grading multiple-choice quiz about: "{task}".
        
        Generate exactly 5 questions based on the provided notes context (if available).
        
        You MUST respond ONLY with a raw JSON array. Do not wrap in markdown tags. Do not add any text before or after the JSON.
        
        Each item in the JSON array must follow this structure:
        {{
          "question": "What is attention in transformer blocks?",
          "options": [
            "A mechanism to focus on specific sequence tokens",
            "A memory compression routine",
            "A learning rate scheduler",
            "A data cleaning utility"
          ],
          "answer": "A mechanism to focus on specific sequence tokens",
          "explanation": "Self-attention computes alignment weights between query and key vectors to aggregate value representations."
        }}
        
        Ensure that the "answer" field matches one of the options EXACTLY.
        
        ---
        Grounded Notes Context:
        {context}
        """
        
        steps.append({
            "title": "JSON Compilation & Validation",
            "status": "completed",
            "message": "Requesting structured JSON exam schema. Parsing question sets."
        })
        
        json_output = llm_service.generate_text(prompt, system_prompt="You are a strict test generator. Output ONLY a valid JSON array of questions, nothing else.")
        
        # Clean potential markdown wrapping
        json_output = json_output.strip()
        if json_output.startswith("```"):
            # Strip markdown code blocks
            lines = json_output.splitlines()
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines[-1].startswith("```"):
                lines = lines[:-1]
            json_output = "\n".join(lines).strip()
            
        # Parse JSON
        try:
            quiz_data = json.loads(json_output)
            formatted_output = "### 📝 Generated Interactive Quiz\n\nScroll to the top panel to start the quiz, or use the JSON layout below to review question sets.\n\n"
            for idx, q in enumerate(quiz_data):
                formatted_output += f"**Q{idx+1}: {q['question']}**\n"
                for opt in q['options']:
                    bullet = "✅" if opt == q['answer'] else "•"
                    formatted_output += f"- {bullet} {opt}\n"
                formatted_output += f"\n*Explanation: {q['explanation']}*\n\n---\n\n"
        except Exception as e:
            print(f"Quiz JSON parsing error: {e}. Output was: {json_output}")
            quiz_data = []
            formatted_output = f"Error generating structured quiz. Raw text:\n\n{json_output}"
            
        return {
            "steps": steps,
            "output": formatted_output,
            "quiz_questions": quiz_data,
            "sources": sources
        }

    def _run_presentation_helper(self, task: str, context: str, steps: list, sources: list) -> Dict[str, Any]:
        steps.append({
            "title": "Structuring Slides Outline",
            "status": "completed",
            "message": "Drafting modular slides, planning slides timing, visual assets, and speaker scripts."
        })
        
        prompt = f"""
        You are a Presentation Coach. Design a professional slide presentation outline explaining: "{task}".
        
        Format in Markdown:
        # Presentation Slides Outline: [Topic Name]
        
        Create exactly 5 slides. For each slide, write in this layout:
        
        ## Slide [Number]: [Title]
        - **Visual Design Suggestion**: (e.g. 'Show an attention matrix heat-map on the left half, bullet points on the right')
        - **Key Bullet Points**:
          - Bullet 1
          - Bullet 2
        - **Speaker Notes**: (What the speaker should say during the talk, keeping it professional, punchy, and clear).
        
        ---
        Grounded Notes Context:
        {context}
        """
        
        steps.append({
            "title": "Slide Synthesis",
            "status": "completed",
            "message": "Generating final slides outline, visual notes, and speaker speech cards."
        })
        
        output = llm_service.generate_text(prompt, system_prompt="You are a presentation design consultant. Structure details logically.")
        
        return {
            "steps": steps,
            "output": output,
            "sources": sources
        }

    def _run_generic_orchestrator(self, task: str, context: str, steps: list, sources: list) -> Dict[str, Any]:
        steps.append({
            "title": "Running General Synthesis",
            "status": "completed",
            "message": "Compiling multi-source facts and generating integrated explanations."
        })
        
        prompt = f"""
        You are GenAI Copilot, an agentic study tutor. Answer this question in detail: "{task}".
        
        Refer to the provided note context if available. Formulate a detailed, structured, educational response.
        
        ---
        Grounded Notes Context:
        {context}
        """
        
        output = llm_service.generate_text(prompt, system_prompt="You are an educational AI assistant. Answer in details using markdown formatting.")
        
        return {
            "steps": steps,
            "output": output,
            "sources": sources
        }

agent_service = AgentService()
