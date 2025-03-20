from langchain_community.document_loaders import PyPDFLoader, DirectoryLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_openai import OpenAI
import os
import logging

logger = logging.getLogger(__name__)

# Extract data from the PDF file
def load_pdf_file(data_path):
    try:
        abs_data_path = os.path.join(os.path.dirname(__file__), data_path)
        if not os.path.exists(abs_data_path):
            raise ValueError(f"Data directory not found: {abs_data_path}")
            
        loader = DirectoryLoader(abs_data_path, glob="*.pdf", loader_cls=PyPDFLoader)
        documents = loader.load()
        
        if not documents:
            raise ValueError(f"No PDF files found in {abs_data_path}")
            
        logger.info(f"Successfully loaded {len(documents)} documents from {abs_data_path}")
        return documents
    except Exception as e:
        logger.error(f"Error loading PDF files: {str(e)}")
        raise

# Split text into chunks
def text_split(extracted_data):
    try:
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=500,
            chunk_overlap=50,  # Increased overlap for better context
            length_function=len,
            add_start_index=True,
        )
        text_chunks = text_splitter.split_documents(extracted_data)
        
        if not text_chunks:
            raise ValueError("No text chunks created from documents")
            
        logger.info(f"Created {len(text_chunks)} text chunks")
        return text_chunks
    except Exception as e:
        logger.error(f"Error splitting text: {str(e)}")
        raise

# Download embeddings from Hugging Face
def download_hugging_face_embeddings():
    try:
        embeddings = HuggingFaceEmbeddings(
            model_name='sentence-transformers/all-MiniLM-L6-v2',
            model_kwargs={'device': 'cpu'},
            encode_kwargs={'normalize_embeddings': True}
        )
        logger.info("Successfully initialized HuggingFace embeddings")
        return embeddings
    except Exception as e:
        logger.error(f"Error initializing embeddings: {str(e)}")
        raise