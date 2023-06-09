import pandas as pd
import json
from collections import Counter
from PIL import Image
import matplotlib.pyplot as plt
from wordcloud import WordCloud
from datetime import datetime
from nltk.corpus import stopwords
from dateutil.relativedelta import relativedelta


def pegar_frequencias(arquivo):
    with open(arquivo) as f:
        conteudo = f.read()
    dados = []
    j = json.loads(conteudo)
    for data, lista in j.items():
        for noticia in lista:
            dados.append([data, noticia['content'].upper()])
    df = pd.DataFrame(dados, columns=['data', 'titulo'])
    df['titulo'] = df.titulo.apply(lambda x: ' ' + x.replace(':', '').replace(',', '').replace('.', '') + ' ')
    df = df.groupby('data').sum()
    return df.titulo.apply(lambda x: Counter(x.split())).reset_index()


g1 = pegar_frequencias('/home/cleomar/Documents/FGV/2023-1/viz/a2/final-project-covid-timeline-1/data/g1.json')
un = pegar_frequencias('/home/cleomar/Documents/FGV/2023-1/viz/a2/final-project-covid-timeline-1/data/un.json')
uol = pegar_frequencias('/home/cleomar/Documents/FGV/2023-1/viz/a2/final-project-covid-timeline-1/data/uol.json')

df = pd.concat([g1, un, uol], ignore_index=True).groupby('data').sum().reset_index()
df['data'] = df.data.apply(lambda x: datetime.strptime(x, '%Y-%m-%d'))

inicio = datetime(2020, 1, 1)
fim = datetime(2020,4,1)
while inicio < datetime(2023, 4, 1):
    palavras_periodo = df[(df.data >= inicio)&(df.data < fim)].titulo.sum()
    remover = stopwords.words('portuguese')
    remover.extend([
        'R$', 'NOVO', 'PEDE', 'MIL', 'DIZ', 'DURANTE', 'FAZ', 'PODE', 'ANUNCIA', 
        'SAO', 'PAULO', 'VAI', 'RIO', 'JANEIRO'
        ])
    for palavra in remover:
        del palavras_periodo[palavra.upper()]

    wc = WordCloud(background_color="black", width=1000, height=1000, max_words=30).generate_from_frequencies(dict(palavras_periodo))
    plt.close()
    plt.imshow(wc)
    plt.savefig(f'./figures/{str(inicio.date())}.png')
    inicio = fim
    fim = inicio + relativedelta(months = 3)
