import streamlit as st
import gspread
from oauth2client.service_account import ServiceAccountCredentials
from datetime import datetime

# ১. কানেকশন সেটআপ (Secrets থেকে ডাটা নিচ্ছে)
info = st.secrets["gcp_service_account"]
scope = ["https://spreadsheets.google.com/feeds", "https://www.googleapis.com/auth/drive"]

try:
    creds = ServiceAccountCredentials.from_json_keyfile_dict(info, scope)
    client = gspread.authorize(creds)
    # আপনার শিটের নাম হুবহু Poultry Data
    sh = client.open("Poultry Data")
    sheet = sh.get_worksheet(0)
    connected = True
except Exception as e:
    connected = False
    st.error(f"কানেকশন সমস্যা: {e}")

st.title("🐔 খামার ডায়েরি (Farm Manager)")

# ২. ডাটা ইনপুট ফরম
if connected:
    with st.form("farm_form", clear_on_submit=True):
        date = st.date_input("তারিখ", datetime.now())
        eggs = st.number_input("ডিম সংখ্যা (Eggs)", min_value=0, step=1)
        feed = st.number_input("খাবার খরচ/পরিমাণ (Feed)", min_value=0.0)
        medicine = st.text_input("ওষুধের নাম/খরচ (Medicine)")
        
        submitted = st.form_submit_button("জমা দিন (Submit)")

    if submitted:
        try:
            sheet.append_row([str(date), eggs, feed, medicine])
            st.success("সফলভাবে গুগল শিটে সেভ হয়েছে! ✅")
        except Exception as e:
            st.error("ডাটা সেভ হয়নি। দয়া করে আবার চেষ্টা করুন।")
