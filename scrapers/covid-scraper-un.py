from bs4 import BeautifulSoup
from urllib.request import urlopen
import pandas as pd
import re
import json

base_url = "https://news.un.org/pt/tags/covid-19"
base_base_url = "https://news.un.org"
pages_dict = {}


def get_page_content(page_number):
    url = base_url + "?page=" + str(page_number)
    page = urlopen(url)
    html = page.read().decode("utf-8")
    soup = BeautifulSoup(html, "html.parser")
    content = soup.find_all("div", class_="node__content")
    content_texts = [c.find('p').text if  c.find('p') is not None else '' for c in content]
    meta = soup.find_all("div", class_="node__meta")
    media = soup.find_all("div", class_="node__media")
    title = soup.find_all("h2", class_="node__title")

    number_of_elements = len(content_texts)
    
    for element in range(number_of_elements):
        date = meta[element].find('time').attrs['datetime'] if meta[element].find('time') is not None else ''
        date_str = pd.to_datetime(date).strftime('%Y-%m-%d')
        content_str = content_texts[element] if content_texts[element] is not None else ''
        media_url = media[element].find('source').attrs['srcset'] if media[element].find('source') is not None else ''
        news_url = title[element].find('a').attrs['href'] if title[element].find('a') is not None else ''
        news_url = f'{base_base_url}{news_url}'
        if date_str != '' and content_str != '' and media_url != '':
            if date_str not in pages_dict:
                pages_dict[date_str] = []
            pages_dict[date_str].append({'content': content_str, 'media': media_url, 'news_url': news_url ,'source': 'UN'})



for page_number in range(0, 111):
    print("Page: " + str(page_number))
    get_page_content(page_number)

# save pages_dict as a json file

with open('pages_dict.json', 'w') as fp:
    json.dump(pages_dict, fp)




























































