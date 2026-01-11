import streamlit as st
import gspread
from oauth2client.service_account import ServiceAccountCredentials

# সিক্রেট থেকে ডাটা পড়া
info = st.secrets["gcp_service_account"]
scope = ["https://spreadsheets.google.com/feeds", "https://www.googleapis.com/auth/drive"]
creds = ServiceAccountCredentials.from_json_keyfile_dict(info, scope)
client = gspread.authorize(creds)

st.title("🐔 খামার ডায়েরি")
st.write("আপনার অ্যাপটি এখন সুরক্ষিত এবং সচল!")
# (বাকি ইনপুট ফর্ম আমি পরে যোগ করে দেব, আগে কানেকশন চেক করি)
