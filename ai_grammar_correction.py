import json
import os
from typing import Dict, Tuple

class SinhalaGrammarCorrector:
    def __init__(self, dict_path: str = "dictionaries"):
        self.dict_path = dict_path
        self.subjects = self.load_dictionary("subjects.json")
        self.base_verbs = self.load_dictionary("verbs.json")
        self.objects = self.load_dictionary("objects.json")

    def load_dictionary(self, filename: str) -> Dict:
        try:
            with open(os.path.join(self.dict_path, filename), 'r', encoding='utf-8') as f:
                return json.load(f)
        except FileNotFoundError:
            print(f"Warning: Dictionary file {filename} not found. Creating empty dictionary.")
            empty_dict = {}
            self.save_dictionary(empty_dict, filename)
            return empty_dict

    def save_dictionary(self, data: Dict, filename: str) -> None:
        os.makedirs(self.dict_path, exist_ok=True)
        with open(os.path.join(self.dict_path, filename), 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

    def display_options(self):
        print("\nAvailable Subjects:")
        print(", ".join(self.subjects.keys()))

        print("\nAvailable Objects:")
        print(", ".join(self.objects.keys()))

        print("\nAvailable Verbs:")
        print(", ".join(self.base_verbs.keys()))

    def get_verb_form(self, base_verb: str, tense: str, subject: str) -> str:
        if base_verb not in self.base_verbs or subject not in self.subjects:
            return base_verb

        verb_base = self.base_verbs[base_verb].get(tense, "")
        if not isinstance(verb_base, str):
            raise ValueError(f"Invalid verb form for base verb '{base_verb}' in tense '{tense}'.")

        subject_suffix = self.subjects[subject]["suffix"]

        if tense == "future":
            return verb_base

        return verb_base + subject_suffix

    def identify_sentence_components(self, sentence: str) -> Tuple[str, str, str]:
        words = sentence.split()
        subject = ""
        obj = ""
        verb = ""

        for word in words:
            if word in self.subjects:
                subject = word
            elif word in self.objects:
                obj = word
            else:
                verb = word

        return subject, obj, verb

    def correct_sentence(self, sentence: str) -> str:
        subject, obj, verb = self.identify_sentence_components(sentence)

        if not subject or not verb:
            return sentence

        base_verb = ""
        tense = "present"
        for base in self.base_verbs:
            if verb.startswith(base):
                base_verb = base
                if verb.endswith("න්න"):
                    tense = "future"
                break

        corrected_verb = self.get_verb_form(base_verb, tense, subject)

        components = [subject]
        if obj and obj in self.objects:
            components.append(obj)
        components.append(corrected_verb)

        return " ".join(components)

    def correct_paragraph(self, paragraph: str) -> str:
        sentences = paragraph.split(".")
        corrected_sentences = [self.correct_sentence(sentence.strip()) for sentence in sentences if sentence.strip()]
        return ". ".join(corrected_sentences) + ("." if paragraph.endswith(".") else "")

if __name__ == "__main__":
    corrector = SinhalaGrammarCorrector()
    print("Sinhala Grammar Corrector\n")
    corrector.display_options()
    user_input = input("\nEnter a sentence to create or correct: ")
    corrected_output = corrector.correct_paragraph(user_input)
    print("\nCorrected Output:")
    print(corrected_output)
