import json
import sys
import os
from collections import Counter

class SplendidGeneticsEngine:
    def __init__(self):
        self.loci_rules = {
            "blauw_locus": {
                "type": "autosomal",
                "alleles": ["wild", "bl", "aq", "pb"]
            },
            "sex_linked_locus": {
                "type": "sex_linked",
                "alleles": ["wild", "op", "cin", "ino", "pal"]
            },
            "donker_locus": {
                "type": "co_dominant",
                "alleles": ["wild", "D"]
            }
        }

    def generate_gametes_male(self, x1_alleles, x2_alleles):
        return [
            {"type": "X", "alleles": x1_alleles, "probability": 0.5},
            {"type": "X", "alleles": x2_alleles, "probability": 0.5}
        ]

    def generate_gametes_female(self, x_alleles):
        return [
            {"type": "X", "alleles": x_alleles, "probability": 0.5},
            {"type": "Y", "alleles": [], "probability": 0.5}
        ]

    def determine_phenotype(self, sex, alleles_map):
        phenotype_features = []
        splits = []

        # 1. Blauw-serie Locus
        bl_alleles = alleles_map.get("blauw_locus", ["wild", "wild"])
        if bl_alleles.count("bl") == 2:
            phenotype_features.append("Blauw")
        elif "aq" in bl_alleles and "bl" in bl_alleles:
            phenotype_features.append("Aqua-Blue (Zeegroen-Blauw intermediair)")
        elif "aq" in bl_alleles and "aq" in bl_alleles:
            phenotype_features.append("Aqua (Zeegroen)")
        elif "pb" in bl_alleles and "bl" in bl_alleles:
            phenotype_features.append("Pastelblauw (Turquoise)")
        else:
            if "bl" in bl_alleles: splits.append("Blauw")
            if "aq" in bl_alleles: splits.append("Aqua")
            if "pb" in bl_alleles: splits.append("Pastelblauw")

        # 2. Geslachtsgebonden Locus
        sl_alleles = alleles_map.get("sex_linked_locus", [])
        if sex == "pop":
            for allele in sl_alleles:
                if allele != "wild":
                    phenotype_features.append(allele.capitalize())
        else:
            counts = Counter(sl_alleles)
            for mutation in ["op", "cin", "ino", "pal"]:
                if counts[mutation] == 2:
                    phenotype_features.append(mutation.capitalize())
                elif counts[mutation] == 1:
                    splits.append(mutation.capitalize())

        # 3. Donkerfactor
        d_alleles = alleles_map.get("donker_locus", ["wild", "wild"])
        d_count = d_alleles.count("D")
        if d_count == 1:
            phenotype_features.append("D-Factor (D-Groen / D-Blauw)")
        elif d_count == 2:
            phenotype_features.append("DD-Factor (Olijf / Mauve)")

        base_color = "Wildkleur (Groen)" if not any(x in phenotype_features for x in ["Blauw", "Aqua", "Pastelblauw", "Aqua-Blue"]) else ""
        visual_str = " ".join([base_color] + phenotype_features).strip().replace("  ", " ")
        split_str = f" split {', '.join(splits)}" if splits else ""
        
        return f"{visual_str}{split_str}"

    def calculate(self, father_genotype, mother_genotype):
        father_gametes = self.generate_gametes_male(father_genotype["X1"], father_genotype["X2"])
        mother_gametes = self.generate_gametes_female(mother_genotype["X"])

        zonen_lijst = []
        dochters_lijst = []

        for fg in father_gametes:
            for mg in mother_gametes:
                combined_prob = fg["probability"] * mg["probability"] * 100
                
                if mg["type"] == "Y":
                    alleles_map = {
                        "blauw_locus": father_genotype["autosomal_blauw"] + mother_genotype["autosomal_blauw"],
                        "sex_linked_locus": fg["alleles"],
                        "donker_locus": father_genotype["autosomal_donker"] + mother_genotype["autosomal_donker"]
                    }
                    phenotype = self.determine_phenotype("pop", alleles_map)
                    dochters_lijst.append((phenotype, combined_prob))
                else:
                    alleles_map = {
                        "blauw_locus": father_genotype["autosomal_blauw"] + mother_genotype["autosomal_blauw"],
                        "sex_linked_locus": fg["alleles"] + mg["alleles"],
                        "donker_locus": father_genotype["autosomal_donker"] + mother_genotype["autosomal_donker"]
                    }
                    phenotype = self.determine_phenotype("man", alleles_map)
                    zonen_lijst.append((phenotype, combined_prob))

        def aggregate_results(lijst):
            summary = {}
            for pheno, prob in lijst:
                summary[pheno] = summary.get(pheno, 0) + prob
            return [f"{int(prob)}% {pheno}" for pheno, prob in summary.items()]

        return {
            "zonen": aggregate_results(zonen_lijst),
            "dochters": aggregate_results(dochters_lijst)
        }

def parse_react_input_to_genotype(user_data, mutations_db):
    mutations = mutations_db["mutations"]
    genotype = {
        "vader": {"X1": [], "X2": [], "autosomal_blauw": [], "autosomal_donker": []},
        "moeder": {"X": [], "autosomal_blauw": [], "autosomal_donker": []}
    }

    # Vader
    vader_in = user_data["vader"]
    all_vader_mutations = set(vader_in["visual"] + vader_in["split"])
    for m_key in all_vader_mutations:
        if m_key not in mutations: continue
        m_type = mutations[m_key]["type"]
        is_visual = m_key in vader_in["visual"]
        is_split = m_key in vader_in["split"]

        if m_type == "sex_linked_recessive":
            if is_visual:
                genotype["vader"]["X1"].append(m_key)
                genotype["vader"]["X2"].append(m_key)
            elif is_split:
                genotype["vader"]["X1"].append(m_key)
                genotype["vader"]["X2"].append("wild")
        elif m_type == "autosomal_recessive":
            if is_visual:
                genotype["vader"]["autosomal_blauw"].extend([m_key, m_key])
            elif is_split:
                genotype["vader"]["autosomal_blauw"].extend(["wild", m_key])
        elif m_type == "co_dominant":
            if is_visual:
                genotype["vader"]["autosomal_donker"].extend(["D", "D"])
            else:
                genotype["vader"]["autosomal_donker"].extend(["wild", "D"])

    while len(genotype["vader"]["autosomal_blauw"]) < 2: genotype["vader"]["autosomal_blauw"].append("wild")
    while len(genotype["vader"]["autosomal_donker"]) < 2: genotype["vader"]["autosomal_donker"].append("wild")

    # Moeder
    moeder_in = user_data["moeder"]
    all_moeder_mutations = set(moeder_in["visual"])
    for m_key in all_moeder_mutations:
        if m_key not in mutations: continue
        m_type = mutations[m_key]["type"]

        if m_type == "sex_linked_recessive":
            genotype["moeder"]["X"].append(m_key)
        elif m_type == "autosomal_recessive":
            genotype["moeder"]["autosomal_blauw"].extend([m_key, m_key])
        elif m_type == "co_dominant":
            genotype["moeder"]["autosomal_donker"].extend(["D", "D"])

    for m_key in moeder_in["split"]:
        if m_key in mutations and mutations[m_key]["type"] == "autosomal_recessive":
            genotype["moeder"]["autosomal_blauw"].extend(["wild", m_key])

    while len(genotype["moeder"]["autosomal_blauw"]) < 2: genotype["moeder"]["autosomal_blauw"].append("wild")
    while len(genotype["moeder"]["autosomal_donker"]) < 2: genotype["moeder"]["autosomal_donker"].append("wild")

    return genotype

def validate_breeding_pair(pair_data, mutations_db):
    warnings = []
    mutations = mutations_db["mutations"]
    for mutation in pair_data["moeder"]["split"]:
        if mutation in mutations and mutations[mutation]["type"] == "sex_linked_recessive":
            warnings.append(f"Biologische waarschuwing: Moeder (pop) kan niet 'split' zijn voor '{mutations[mutation]['name']}'.")
    return warnings

def main():
    try:
        base_path = os.path.dirname(os.path.abspath(__file__))
        mutations_db = json.load(open(os.path.join(base_path, "mutations.json"), 'r', encoding='utf-8'))
        pair_data = json.load(open(os.path.join(base_path, "kweekpaar.json"), 'r', encoding='utf-8'))
        
        warnings = validate_breeding_pair(pair_data, mutations_db)
        engine = SplendidGeneticsEngine()
        biologische_genotypes = parse_react_input_to_genotype(pair_data, mutations_db)
        results = engine.calculate(biologische_genotypes["vader"], biologische_genotypes["moeder"])
        
        print(json.dumps({"status": "success", "warnings": warnings, "results": results}, ensure_ascii=False))
    except Exception as e:
        print(json.dumps({"status": "error", "message": str(e)}))

if __name__ == "__main__":
    main()
