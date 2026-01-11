import streamlit as st
import pandas as pd
import os
from datetime import datetime

# ফাইলের নাম (যেখানে সব ডাটা সেভ হবে)
DATA_FILE = "farm_data.csv"

# ১. ডাটা লোড করার ফাংশন
def load_data():
    if os.path.exists(DATA_FILE):
        return pd.read_csv(DATA_FILE)
    else:
        # ফাইল না থাকলে নতুন কলাম তৈরি করবে
        return pd.DataFrame(columns=["তারিখ", "ডিম সংখ্যা", "খাবার খরচ", "ওষুধ"])

# ২. ডাটা সেভ করার ফাংশন
def save_data(df):
    df.to_csv(DATA_FILE, index=False)

st.set_page_config(page_title="আমার খামার", page_icon="🐔")
st.title("🐔 খামার ডায়েরি (Offline Mode)")

# ৩. ইনপুট ফরম
with st.form("farm_form", clear_on_submit=True):
    date = st.date_input("তারিখ", datetime.now())
    eggs = st.number_input("ডিম সংখ্যা (Eggs)", min_value=0, step=1)
    feed = st.number_input("খাবার খরচ (Feed)", min_value=0.0)
    medicine = st.text_input("ওষুধের নাম (Medicine)")
    
    submitted = st.form_submit_button("জমা দিন (Save Data)")

if submitted:
    df = load_data()
    # নতুন ডাটা যোগ করা
    new_data = pd.DataFrame([[str(date), eggs, feed, medicine]], 
                            columns=["তারিখ", "ডিম সংখ্যা", "খাবার খরচ", "ওষুধ"])
    df = pd.concat([df, new_data], ignore_index=True)
    save_data(df)
    st.success("তথ্য অ্যাপের স্টোরেজে সেভ হয়েছে! ✅")

# ৪. সেভ করা ডাটা টেবিল আকারে দেখানো
st.subheader("📋 আগের সকল রেকর্ড")
all_records = load_data()
if not all_records.empty:
    st.dataframe(all_records)
else:
    st.info("এখনো কোনো তথ্য সেভ করা হয়নি।")
