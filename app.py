import streamlit as st
import gspread
from oauth2client.service_account import ServiceAccountCredentials
from datetime import datetime

# ১. কানেকশন সেটআপ (সরাসরি আপনার Secrets থেকে ডাটা নিচ্ছে)
try:
    info = st.secrets["gcp_service_account"]
    scope = ["https://spreadsheets.google.com/feeds", "https://www.googleapis.com/auth/drive"]
    creds = ServiceAccountCredentials.from_json_keyfile_dict(info, scope)
    client = gspread.authorize(creds)
    
    # ২. গুগল শিট ওপেন করা (Poultry Data)
    sh = client.open("Poultry Data")
    sheet = sh.get_worksheet(0)
    connected = True
except Exception as e:
    connected = False
    st.error(f"কানেকশন সমস্যা: {e}")

# অ্যাপের ইন্টারফেস
st.set_page_config(page_title="আমার খামার", page_icon="🐔")
st.title("🐔 খামার ডায়েরি (Farm Manager)")

if connected:
    # ৩. ডাটা ইনপুট ফরম
    with st.form("farm_form", clear_on_submit=True):
        col1, col2 = st.columns(2)
        with col1:
            date = st.date_input("তারিখ", datetime.now())
            eggs = st.number_input("ডিম সংখ্যা (Eggs)", min_value=0, step=1)
        with col2:
            feed = st.number_input("খাবার খরচ (Feed)", min_value=0.0)
            medicine = st.text_input("ওষুধের নাম (Medicine)")
        
        submitted = st.form_submit_button("জমা দিন (Submit)")

    if submitted:
        try:
            # ৪. শিটে ডাটা পাঠানো
            sheet.append_row([str(date), eggs, feed, medicine])
            st.success("সফলভাবে গুগল শিটে সেভ হয়েছে! ✅")
        except Exception as e:
            st.error(f"ডাটা সেভ করতে সমস্যা হয়েছে: {e}")
else:
    st.warning("অ্যাপটি শিটের সাথে কানেক্ট হতে পারেনি। দয়া করে আপনার Streamlit Secrets চেক করুন।")
