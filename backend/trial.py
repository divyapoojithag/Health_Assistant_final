import os
from langchain_community.document_loaders import PyPDFLoader, DirectoryLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from pinecone.grpc import PineconeGRPC as Pinecone
from langchain_pinecone import PineconeVectorStore
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

PINECONE_API_KEY = os.environ.get('PINECONE_API_KEY')
os.environ["PINECONE_API_KEY"] = PINECONE_API_KEY

# Initialize Pinecone
pc = Pinecone(api_key=PINECONE_API_KEY)
index_name = "medicalbot"
index = pc.Index(index_name)

# Function to list already indexed PDFs
def get_indexed_pdfs(index):
    """
    Retrieve all indexed PDFs from Pinecone metadata.
    Assumes metadata contains 'source' field (filename).
    """
    existing_pdfs = set()
    
    # Fetch all vectors (or use a specific namespace if used)
    query_results = index.describe_index_stats()

    print("line 31", query_results)
    
    if "namespaces" in query_results:
        for namespace in query_results["namespaces"]:
            vectors = index.fetch([namespace])
            print("line 36", vectors)
            for vector in vectors["vectors"].values():
                if "metadata" in vector and "source" in vector["metadata"]:
                    existing_pdfs.add(vector["metadata"]["source"])
    
    return existing_pdfs

# Function to process only new PDFs
def process_new_pdfs(data_path, indexed_pdfs):
    loader = DirectoryLoader(data_path, glob="*.pdf", loader_cls=PyPDFLoader)
    documents = loader.load()
    
    # Filter only new PDFs
    new_documents = [doc for doc in documents if os.path.basename(doc.metadata["source"]) not in indexed_pdfs]
    
    return new_documents

# Load previously indexed PDFs
indexed_pdfs = get_indexed_pdfs(index)

# Extract data from new PDFs only
new_extracted_data = process_new_pdfs("Data/", indexed_pdfs)

# If new PDFs are found, process them
if new_extracted_data:
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=20)
    text_chunks = text_splitter.split_documents(new_extracted_data)
    
    # Generate embeddings
    embeddings = HuggingFaceEmbeddings(model_name='sentence-transformers/all-MiniLM-L6-v2')
    
    # Upsert new embeddings into Pinecone
    docsearch = PineconeVectorStore.from_documents(
        documents=text_chunks,
        index_name=index_name,
        embedding=embeddings,
    )
    
    print(f"✅ Successfully added {len(new_extracted_data)} new PDFs to Pinecone!")
else:
    print("📌 No new PDFs found. Pinecone index is already up to date.")