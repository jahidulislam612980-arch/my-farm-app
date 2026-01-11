import streamlit as st
import gspread
from oauth2client.service_account import ServiceAccountCredentials
from datetime import datetime

# ১. গুগল শিট কানেকশন সেটআপ (Secrets থেকে ডাটা নিচ্ছে)
info = st.secrets["gcp_service_account"]
scope = ["https://spreadsheets.google.com/feeds", "https://www.googleapis.com/auth/drive"]

try:
    # কানেকশন রিফ্রেশ করার জন্য এটি সবচেয়ে ভালো উপায়
    creds = ServiceAccountCredentials.from_json_keyfile_dict(info, scope)
    client = gspread.authorize(creds)
    # আপনার শিটের নাম হুবহু Poultry Data হতে হবে
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
            # শিটে ডাটা পাঠানো
            sheet.append_row([str(date), eggs, feed, medicine])
            st.success("সফলভাবে গুগল শিটে সেভ হয়েছে! ✅")
        except Exception as e:
            st.error(f"ডাটা সেভ করতে সমস্যা হয়েছে। দয়া করে পেজটি রিফ্রেশ দিন।")
