import streamlit as st
import gspread
from oauth2client.service_account import ServiceAccountCredentials
from datetime import datetime

# ১. কানেকশন সেটআপ (এটি সরাসরি আপনার Secrets থেকে ডাটা নেবে)
info = st.secrets["gcp_service_account"]
scope = ["https://spreadsheets.google.com/feeds", "https://www.googleapis.com/auth/drive"]

try:
    creds = ServiceAccountCredentials.from_json_keyfile_dict(info, scope)
    client = gspread.authorize(creds)
    sheet = client.open("Poultry Data").get_worksheet(0)
    connected = True
except Exception as e:
    connected = False
    st.error(f"কানেকশন সমস্যা: {e}")

st.title("🐔 খামার ডায়েরি")

# ২. ডাটা ইনপুট ফরম
if connected:
    with st.form("farm_form", clear_on_submit=True):
        eggs = st.number_input("আজকের ডিম (সংখ্যা)", min_value=0, step=1)
        feed = st.number_input("খাবার খরচ (টাকা)", min_value=0.0)
        medicine = st.text_input("ওষুধের নাম")
        submitted = st.form_submit_button("জমা দিন")

    if submitted:
        sheet.append_row([str(datetime.now().date()), eggs, feed, medicine])
        st.success("সফলভাবে সেভ হয়েছে! ✅")
