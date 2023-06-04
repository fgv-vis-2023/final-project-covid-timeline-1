import pandas as pd
from datetime import date
from dateutil.relativedelta import relativedelta
from bs4 import BeautifulSoup
import requests
from lxml import etree
from urllib.parse import unquote
import random
from time import sleep
import re


def random_user_agent():
    user_agent = [
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1.1 Safari/605.1.15',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:77.0) Gecko/20100101 Firefox/77.0',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.97 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:77.0) Gecko/20100101 Firefox/77.0',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.97 Safari/537.36',
    ]
    return random.choice(user_agent)


def pegar_noticias_pagina(pagina):
    noticias_pagina = pd.DataFrame()
    soup = BeautifulSoup(pagina.content, "html.parser")
    dom = etree.HTML(str(soup))
    noticias = dom.xpath('//ul[contains(@class, "results__list")]//li[@class="widget widget--card widget--info"]')
    for noticia in noticias:
        try:
            url_noticia = unquote(unquote(noticia.xpath('.//a')[0].attrib['href']))
        except:
            url_noticia = None
        try:
            link_imagem= unquote(unquote(noticia.xpath('.//img')[0].attrib['src']))
        except:
            link_imagem = None
        try:
            titulo = noticia.xpath('.//div[contains(@class, "widget--info__title")]')[0].text.strip()
        except:
            titulo = None
        try:
            data = noticia.xpath('.//div[@class="widget--info__meta"]')[0].text
        except:
            data = None
        nova_noticia = pd.DataFrame({'url': [url_noticia], 'img': [link_imagem],
                                    'titulo': [titulo], 'data': [data]})
        noticias_pagina = pd.concat([noticias_pagina, nova_noticia], ignore_index=True)
    return noticias_pagina


def extrair_url(string):
    return re.search('(?<=&u=)https:.*', string).group()


def filtrar_urls(string):
    pattern = re.compile(
        r'.*g1.globo.com/(ro|ac|am|rr|pa|ap|to|ma|pi|ce|rn|pb|pe|al|se|ba|mg|es|rj|sp|pr|sc|rs|ms|mt|go|df)/.*'
    )
    if pattern.match(string) or 'podcast' in string:
        return False
    return True


def extrair_data(string):
    if 'há' in string:
        data = [30, 5, 2023]
    else: 
        data = list(map(int, string.strip()[0:10].split('/')))
    return str(date(data[2], data[1], data[0]))


def ajustar_imagem(string):
    if string is None:
        return None
    else:
        return 'https:' + string


dados = pd.DataFrame()
data_inicio = date(2020, 1, 1)
data_fim = data_inicio + relativedelta(months=1) - relativedelta(days=1)
while data_inicio != date(2023, 6, 1):
    print('Data:', str(data_inicio), '-', str(data_fim))
    for num_pag in range(1, 21):
        print('  Pagina:', num_pag)
        url = f'https://g1.globo.com/busca/?q=covid&order=relevant&from={data_inicio}T00%3A00%3A00-0300&to={data_fim}T23%3A59%3A59-0300&species=notícias&page={num_pag}'
        pagina = requests.get(url, headers = {'User-Agent': random_user_agent()})
        dados = pd.concat([dados, pegar_noticias_pagina(pagina)], ignore_index=True)
        sleep(random.randint(1, 3))
    data_inicio = data_inicio + relativedelta(months=1)
    data_fim = data_inicio + relativedelta(months=1) - relativedelta(days=1)


def filtrar_por_titulo(titulo):
    string = titulo.lower()
    palavras_chave = ['covid', 'corona', 'oms', 'vírus', 'virus']
    for palavra in palavras_chave:
        if palavra in string:
            return True
    return False


df = dados.copy()
df['url'] = df.url.apply(extrair_url)
df = df[df.url.apply(filtrar_urls)]
df = df[df.titulo.apply(filtrar_por_titulo)]
df['data'] = df.data.apply(extrair_data)
df['img'] = df.img.apply(ajustar_imagem)
df = df.rename({'img': 'media', 'titulo': 'content'}, axis=1)
df = df[['data', 'content', 'media']]
df['source'] = 'G1'
df['data'] = df.data.apply(str)
df = df.fillna('').drop_duplicates()

j = df.groupby('data').apply(lambda g: g.drop('data', axis=1).to_dict(orient='records')).to_dict()
text_file = open("../data/g1.json", "w")
text_file.write(str(j))
text_file.close()
