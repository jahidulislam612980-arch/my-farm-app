import streamlit as st
import gspread
from oauth2client.service_account import ServiceAccountCredentials
from datetime import datetime

# ১. গুগল শিট কানেকশন সেটআপ
info = {
    "type": "service_account",
    "project_id": "long-province-484004-a7",
    "private_key_id": "6eb129f47136ed74a11ddcaa71ab0e2f90eff063",
    "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDMNkOhmxi66GXR\nFKZenOj2Q8inY6BhNd11HtusbGgjURVDcbx3o6woJR0cZvyZqs9ieN8OES19Xhm9\nQceYcO7T8sFc3CyUe4WOxZc50pvoMO1gPSNPtczCN5MUB/BCflkmEp9qRGc7lAvy\nRYh9+/aGrbfYXoETQ04coYmCg4IIbGVODLq6Ks/Txj3H+abgRtC9autdgFE8HPdi\nTD3D45HL2idFhKIeysbF16iRzDwxE+Dw54/xvrKM9ntcvbIzizEqWi+we2/6YdXg\nBHLbnEJ6qBR5Mz/P4q2rsNKOrv1usSts3fsgAYarQRKja7wBqZVw9eESyWkCUEQd\nJyUW1VaPAgMBAAECggEANyPv3xMh+lYGKA6LXcDApr5mz8v24kjJI3bRmh0rgV3D\ngBKV8TggpDZhReoJCvU0SkKY+BNrVQ6zpIa+fksAMfq6e3h4ER/JUGPKEbLspiWP\n8wyPHFbakxaugBokpc+4Aq/Em80cktnG4AQmdt4yEuuVWLcr4yepT9HOb49S7TLc\nAYAkI0eW7P8Y87pIVSeuZmkP0MVXMh6MRX+30ZZ0jABrljSS88PaQ/9vOJwC7tEY\nfB1f12u/xgxk72c6+Dv1TaKiO0/l+j7RNb2cA+Ruz9xleob9I7f/EsR1I/pbFWtY\nHhH79yZtys90tMIbZlT0UqdpQHjVTYm6xIwBONfWAQKBgQDxESdY8D86eL0p8Dp7\nBQgl1swmV9A4ts9+72+Ey/aMZIGjE1GPiSNFs9+remE495KnR3dI1efxdNJJx00G\nTKQiAzqQ0ddu/z6YvO+Jp2yhB9ikewRrmxWmvuzNdAcNEU1ma9NgImgcgCw3fGXI\nSlOeat7cvt9fDJfoNS4ybUXnyQKBgQDY3KmVH9sAdRqVMNBbUJjjLKVkW/Ma9Xrc\nYgX2SahrNm9SVde+NfX/zJ7UAX9yK8pDMTk/ZqpwwAI9rkMngwqCSJIykuu9Px5x\nnRSncjZN090EQvqjcZoQfZyOeN6UA30I6yM6GzEvIHlRmfZxDEc6gF1xAI6G289i\npL/skvonlwKBgEknm3kx7v4fhcgkTprmfAJ/nJRGMboEQBOVNZJnEvqnxW9nfWjB\nhSKx4z52dOqEtsxss5Y205xCh048XPN8bpKjyDIKfAYDD0vqigaL+Dsl1miTrFO7\nTGa9qb7vZvRgO8zJC+wwhMehXcm4xmpxo85/QAJdKgv+FlsxSEOlRYGBAoGBAMaK\nPzen0ni4vX2ZEyiGwXI6jbEz/X3RAIqDs7Gn/ekqDQD0VnBuNqnaTA8M0AFW1fZu\nOlsxQxm2sFaIFDM4ZYahqjdjCzBXeSfLB/3FMrJOJSqhp5W7i7FNTuehASXBi9d+\nbuHjw0PCF0/+BQG6m/uTSfkK6XHODC/jZVLRvPRBAoGBAMVuqTe5k0V+jcQ8wbSB\nSb43vGyNDYfRAXfDOaBqIqDkA22qeDXc19kAObn+YBdyS2F2JvZzQFkmwXujG8TO\nu8eH1doxOK/WAS1/h2sEN53TjoIgFuDQ6sfbNolsceqCAqxBjADtChSEliKmOJi2\n4tfoAQM/X52462uSggk8dhS0\n-----END PRIVATE KEY-----\n",
    "client_email": "farm-manager@long-province-484004-a7.iam.gserviceaccount.com",
    "client_id": "103955096908109788096",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/farm-manager%40long-province-484004-a7.iam.gserviceaccount.com"
}

scope = ["https://spreadsheets.google.com/feeds", "https://www.googleapis.com/auth/drive"]
creds = ServiceAccountCredentials.from_json_keyfile_dict(info, scope)
client = gspread.authorize(creds)

# আপনার শিটের নাম এখানে হুবহু লিখুন
# উদাহরণ: sheet = client.open("Poultry Data").sheet1
try:
sheet = client.open("Poultry Data").get_worksheet(0) 
except Exception as e:
    st.error("গুগল শিটটি খুঁজে পাওয়া যাচ্ছে না। দয়া করে শিটের নাম চেক করুন।")

st.title("🐔 খামার ডায়েরি (Farm Manager)")

# ইনপুট ফরম
with st.form("farm_form", clear_on_submit=True):
    date = st.date_input("তারিখ", datetime.now())
    eggs = st.number_input("ডিম সংখ্যা (Eggs)", min_value=0, step=1)
    feed = st.number_input("খাবার খরচ/পরিমাণ (Feed)", min_value=0.0)
    medicine = st.text_input("ওষুধের নাম/খরচ (Medicine)")
    
    submitted = st.form_submit_button("জমা দিন (Submit)")

if submitted:
    try:
        # শিটে ডাটা পাঠানো (Date, Eggs, Feed, Medicine কলাম অনুযায়ী)
        sheet.append_row([str(date), eggs, feed, medicine])
        st.success("সফলভাবে গুগল শিটে সেভ হয়েছে! ✅")
    except Exception as e:
        st.error(f"ডাটা সেভ করতে সমস্যা হয়েছে: {e}")



