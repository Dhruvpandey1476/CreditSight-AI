import json
from fpdf import FPDF
from fpdf.enums import XPos, YPos
import datetime

class CreditSightReport(FPDF):
    def header(self):
        # Minimalist Banking Header
        self.set_fill_color(255, 255, 255)
        self.rect(0, 0, 210, 22, 'F')
        
        self.set_xy(10, 8)
        self.set_font('helvetica', 'B', 18)
        self.set_text_color(15, 30, 60) # Navy Blue
        self.cell(0, 8, 'CREDITSIGHT', new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        
        self.set_xy(10, 16)
        self.set_font('helvetica', '', 8)
        self.set_text_color(100, 100, 100) # Slate Grey
        self.cell(0, 4, 'ALTERNATIVE CREDIT INTELLIGENCE REPORT')
        
        self.set_xy(150, 10)
        self.set_font('helvetica', '', 8)
        self.cell(50, 4, f'Generated: {datetime.datetime.now().strftime("%Y-%m-%d %H:%M")}', align='R')
        
        # Elegant separator line
        self.set_draw_color(200, 205, 215)
        self.set_line_width(0.3)
        self.line(10, 24, 200, 24)

    def draw_section_title(self, x, y, title):
        self.set_xy(x, y)
        self.set_font('helvetica', 'B', 7)
        self.set_text_color(80, 90, 105)
        self.cell(0, 4, title.upper())

def generate_creditsight_pdf(data, output_path):
    pdf = CreditSightReport()
    pdf.set_auto_page_break(auto=False)
    pdf.add_page()
    
    # -- ROW 1: Profile & Score Card --
    # Profile Side
    pdf.draw_section_title(10, 28, "Borrower Profile")
    pdf.set_draw_color(220, 225, 235)
    pdf.line(10, 33, 105, 33)
    
    y_off = 36
    inc = data.get('monthly_income_est', 0)
    details = [
        ("Applicant Name", data.get('borrower_name', 'N/A')),
        ("Reference ID", str(data.get('assessment_id', 'N/A'))[:8].upper()),
        ("Employment", data.get('employment_type', 'N/A').title()),
        ("Est. Income", f"INR {inc:,}")
    ]
    for label, val in details:
        pdf.set_xy(10, y_off)
        pdf.set_font('helvetica', '', 8)
        pdf.set_text_color(120, 130, 140)
        pdf.cell(30, 5, label)
        
        pdf.set_xy(40, y_off)
        pdf.set_font('helvetica', 'B', 8)
        pdf.set_text_color(15, 30, 60)
        pdf.cell(60, 5, str(val))
        y_off += 6

    # Score Card Side
    pdf.draw_section_title(115, 28, "Risk Assessment Result")
    pdf.line(115, 33, 200, 33)
    
    pdf.set_xy(115, 38)
    pdf.set_font('helvetica', 'B', 28)
    pdf.set_text_color(15, 30, 60)
    pdf.cell(30, 12, str(data.get('final_score', 0)))
    
    pdf.set_xy(145, 38)
    pdf.set_font('helvetica', 'B', 9)
    pdf.set_text_color(100, 100, 100)
    pdf.cell(50, 4, f"Final Tier: {data.get('credit_tier', 'N/A')}")
    
    pdf.set_xy(145, 43)
    pdf.set_font('helvetica', '', 7)
    pdf.cell(50, 3.5, f"ML Base Score:     {data.get('ml_score', 'N/A')}")
    pdf.set_xy(145, 47)
    pdf.cell(50, 3.5, f"Agent Composite: {data.get('agent_composite_score', 'N/A')}")
    
    # -- ROW 2: Recommendation & Reasoning --
    y_r = 65
    pdf.draw_section_title(10, y_r, "Executive Recommendation")
    pdf.line(10, y_r+5, 200, y_r+5)
    
    raw_rec = data.get('resolver_output', {})
    rec = raw_rec.get('lender_recommendation', 'N/A') if isinstance(raw_rec, dict) else str(raw_rec)
    reasoning = raw_rec.get('resolution_reasoning', '') if isinstance(raw_rec, dict) else ''
    
    pdf.set_xy(10, y_r+8)
    pdf.set_font('helvetica', 'B', 9)
    pdf.set_text_color(15, 30, 60)
    pdf.multi_cell(190, 5, rec)
    
    curr_y = pdf.get_y() + 1
    pdf.set_xy(10, curr_y)
    pdf.set_font('helvetica', '', 8)
    pdf.set_text_color(60, 70, 80)
    pdf.multi_cell(190, 4, reasoning)

    # -- ROW 3: Strengths & Risks --
    y_sr = pdf.get_y() + 8
    pdf.draw_section_title(10, y_sr, "Key Positives")
    pdf.line(10, y_sr+5, 100, y_sr+5)
    
    pdf.draw_section_title(110, y_sr, "Key Risk Factors")
    pdf.line(110, y_sr+5, 200, y_sr+5)
    
    strengths = raw_rec.get('key_strengths', []) if isinstance(raw_rec, dict) else []
    risks = raw_rec.get('key_risks', []) if isinstance(raw_rec, dict) else []
    
    pdf.set_font('helvetica', '', 8)
    
    # Strengths
    y_str = y_sr + 8
    pdf.set_text_color(30, 100, 50) # Subdued green
    for s in strengths[:3]:
        pdf.set_xy(10, y_str)
        pdf.multi_cell(90, 3.5, f"+ {s}")
        y_str += (len(s) // 55 + 1) * 3.5 + 2
        
    # Risks
    y_rsk = y_sr + 8
    pdf.set_text_color(160, 40, 40) # Subdued red
    for r in risks[:3]:
        pdf.set_xy(110, y_rsk)
        pdf.multi_cell(90, 3.5, f"- {r}")
        y_rsk += (len(r) // 55 + 1) * 3.5 + 2

    # -- ROW 4: ML Explainability (SHAP) --
    y_ml = max(y_str, y_rsk) + 6
    pdf.draw_section_title(10, y_ml, "Algorithmic Driver Analysis (Explainability)")
    pdf.line(10, y_ml+5, 200, y_ml+5)
    
    shap = data.get('shap_values', {})
    pdf.set_xy(10, y_ml+8)
    if shap:
        col = 0
        y_sh = y_ml+8
        for k, v in list(shap.items())[:6]:
            k_fmt = k.replace('_', ' ').title()
            val_str = f"[{v:+.2f}]"
            
            pdf.set_xy(10 + col * 63, y_sh)
            pdf.set_font('helvetica', '', 7)
            pdf.set_text_color(80, 90, 105)
            pdf.cell(40, 4, k_fmt[:22])
            
            pdf.set_font('helvetica', 'B', 7)
            pdf.set_text_color(30, 100, 50) if v >= 0 else pdf.set_text_color(160, 40, 40)
            pdf.cell(15, 4, val_str)
            
            col += 1
            if col > 2:
                col = 0
                y_sh += 5
    else:
        pdf.set_font('helvetica', 'I', 7)
        pdf.set_text_color(120, 130, 140)
        pdf.cell(190, 4, "No feature importance available.")

    # -- ROW 5: 4 Agent BMC Grid (Concise) --
    # Calculate starting Y
    y_ag = y_ml + 22
    pdf.draw_section_title(10, y_ag, "Specialist Agents Output (Module Diagnostics)")
    pdf.line(10, y_ag+5, 200, y_ag+5)
    
    agents = [
        ("UPI Intelligence", data.get('upi_analysis', {})),
        ("Income Validation", data.get('income_analysis', {})),
        ("Obligation & Bills", data.get('rental_analysis', {})),
        ("Behavioral Footprint", data.get('behavioral_analysis', {}))
    ]
    
    grid_coords = [(10, y_ag+8), (110, y_ag+8), (10, y_ag+50), (110, y_ag+50)]
    
    for i, (name, ad) in enumerate(agents):
        x_base, y_base = grid_coords[i]
        
        # Subtle box background
        pdf.set_fill_color(248, 249, 252)
        pdf.rect(x_base, y_base, 90, 38, 'F')
        
        # Border
        pdf.set_draw_color(220, 225, 235)
        pdf.rect(x_base, y_base, 90, 38, 'D')
        
        pdf.set_xy(x_base+3, y_base+3)
        pdf.set_font('helvetica', 'B', 8)
        pdf.set_text_color(15, 30, 60)
        pdf.cell(60, 4, name)
        
        sc = ad.get('signal_score', 'N/A')
        pdf.set_font('helvetica', 'B', 8)
        pdf.set_text_color(60, 70, 80)
        pdf.set_xy(x_base+60, y_base+3)
        pdf.cell(27, 4, f"Score: {sc}", align='R')
        
        summ = ad.get('summary', 'No summary generated.')
        pdf.set_xy(x_base+3, y_base+9)
        pdf.set_font('helvetica', 'I', 7)
        pdf.set_text_color(100, 100, 100)
        pdf.multi_cell(84, 3, summ[:180])
        
        # Top Positive
        pos = ad.get('positive_signals', [])
        pdf.set_xy(x_base+3, y_base+22)
        pdf.set_font('helvetica', 'B', 7)
        pdf.set_text_color(30, 100, 50)
        p_txt = pos[0][:75] if pos else "No strong positives detected."
        pdf.multi_cell(84, 3, f"+ {p_txt}")
        
        # Top Risk
        rsk = ad.get('risk_signals', [])
        pdf.set_xy(x_base+3, y_base+30)
        pdf.set_font('helvetica', 'B', 7)
        pdf.set_text_color(160, 40, 40)
        r_txt = rsk[0][:75] if rsk else "No immediate risks identified."
        pdf.multi_cell(84, 3, f"- {r_txt}")

    # Footer
    pdf.set_xy(10, 285)
    pdf.set_font('helvetica', '', 6)
    pdf.set_text_color(150, 150, 150)
    note = "This score is generated from alternative data signals per RBI guidelines for credit-invisible borrowers. Not a substitute for regulatory bureau checks."
    pdf.cell(190, 3, note, align='C')

    pdf.output(output_path)