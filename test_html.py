import streamlit as st
st.set_page_config(page_title="HTML Test")
st.markdown("<div style='color:red; font-size:24px; background:black; padding:20px;'>TEST HTML RENDER</div>", unsafe_allow_html=True)
st.html("<div style='color:green; font-size:24px; background:black; padding:20px;'>TEST ST.HTML RENDER</div>")
st.markdown("Regular text below")
